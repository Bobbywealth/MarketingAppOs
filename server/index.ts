import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { initializeStripe } from "./stripeService";
import { initializeEmailService } from "./emailService";
import { initializeEmailParser } from "./emailParser";
import { startEmailSyncService } from "./emailSyncService";
import { startVisitsAutomation } from "./visitsAutomation";
import { startTaskAutomation } from "./taskAutomation";
import { storage } from "./storage";
import { ensureMinimumSchema } from "./ensureSchema";

const app = express();

// Security Middleware
// In development, relax CSP for Vite HMR; in production, use strict defaults but allow Vimeo
const isDev = process.env.NODE_ENV === 'development';
app.use(helmet({
  contentSecurityPolicy: isDev ? false : {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-src": ["'self'", "https://player.vimeo.com"],
      "script-src": ["'self'", "'unsafe-inline'", "https://player.vimeo.com"],
      "img-src": ["'self'", "data:", "https://vimeo.com", "https://*.vimeocdn.com"],
      "connect-src": ["'self'", "https://vimeo.com", "https://*.vimeocdn.com"],
    },
  },
  crossOriginEmbedderPolicy: isDev ? false : undefined,
})); // Sets various HTTP headers for security
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 login/register attempts per hour
  message: "Too many authentication attempts, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});

const publicSignupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 public signup requests per 15 minutes
  message: "Too many signup requests, please try again in a few minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", generalLimiter);
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/signup", publicSignupLimiter);
app.use("/api/signup-simple", publicSignupLimiter);
app.use("/api/early-lead", publicSignupLimiter);
app.use("/api/social-audit", publicSignupLimiter);

app.use(express.json({ limit: "10kb" })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Sanitize sensitive fields from logs
        const sanitizedResponse = { ...capturedJsonResponse };
        const sensitiveFields = ['password', 'accessToken', 'refreshToken', 'token', 'secret'];
        sensitiveFields.forEach(field => {
          if (sanitizedResponse[field]) sanitizedResponse[field] = '[REDACTED]';
        });
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = createServer(app);
  
  // Ensure critical schema pieces exist (prevents 500s if prod DB hasn't been migrated yet)
  await ensureMinimumSchema();

  // Initialize services
  initializeStripe();
  initializeEmailService();
  initializeEmailParser();
  
  await setupAuth(app);
  registerRoutes(app);

  // Start background email sync service (syncs every 30 minutes)
  startEmailSyncService(storage);
  // Start overdue upload automation (hourly)
  startVisitsAutomation();
  // Start task due date reminders (daily)
  startTaskAutomation();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = app.get("env") === "production" && status === 500 
      ? "Internal Server Error" 
      : err.message || "Internal Server Error";

    if (status === 500) {
      console.error(err);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
