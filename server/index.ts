import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { appendFile, mkdir } from "node:fs/promises";
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
import { startMarketingBroadcastScheduler } from "./marketingBroadcastScheduler";
import { startSeriesProcessor } from "./marketingSeriesProcessor";
import { startBackgroundJobs } from "./backgroundJobs";
import { startLeadAutomationProcessor } from "./leadAutomationProcessor";
import { storage } from "./storage";
import { ensureMinimumSchema } from "./ensureSchema";
import path from "node:path";
import { existsSync } from "node:fs";

// #region agent log
const AGENT_DEBUG_LOG_PATH = "/Users/bobbyc/Downloads/MarketingOS 2/.cursor/debug.log";
function agentAppendLog(payload: any) {
  void appendFile(AGENT_DEBUG_LOG_PATH, `${JSON.stringify(payload)}\n`).catch(() => {});
}
// #endregion

const app = express();
app.set('trust proxy', 1); // Trust the first proxy (e.g. Nginx, Replit, Heroku)

// #region Twilio media bypass
// We must allow Twilio to fetch media (images/video) for MMS without authentication.
// This route is placed at the very top of the app to bypass all security/auth middleware.
app.get("/uploads/:filename", (req, res, next) => {
  const ua = (req.get("user-agent") || "").toLowerCase();
  const hasTwilioHeader = !!req.get("x-twilio-signature") || ua.includes("twilio");
  
  if (hasTwilioHeader) {
    const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
    const filePath = path.join(UPLOAD_DIR, req.params.filename);

    if (existsSync(filePath)) {
      const ext = path.extname(req.params.filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
        '.webm': 'video/webm', '.ogg': 'video/ogg', '.mov': 'video/quicktime'
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      return res.sendFile(filePath);
    }
  }
  next();
});
// #endregion

// Security Middleware
// In development, relax CSP for Vite HMR; in production, use strict defaults but allow Vimeo
const isDev = process.env.NODE_ENV === 'development';
app.use(helmet({
  contentSecurityPolicy: isDev ? false : {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-src": ["'self'", "https://player.vimeo.com"],
      "script-src": ["'self'", "'unsafe-inline'", "https://player.vimeo.com", "https://apis.google.com"],
      "img-src": ["'self'", "data:", "https://vimeo.com", "https://*.vimeocdn.com", "https://*.googleapis.com", "https://*.gstatic.com"],
      "connect-src": ["'self'", "https://vimeo.com", "https://*.vimeocdn.com", "https://*.googleapis.com", "https://*.gstatic.com"],
      "font-src": ["'self'", "https://*.googleapis.com", "https://*.gstatic.com", "https://r2cdn.perplexity.ai", "data:"],
      "style-src": ["'self'", "'unsafe-inline'", "https://*.googleapis.com"],
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

// Blog posts and other content can be large
app.use(express.json({ limit: "1mb" })); 
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// #region agent log
app.use((req, _res, next) => {
  // Minimal request tracing for login route only (no secrets).
  if (req.path === "/api/login") {
    agentAppendLog({
      sessionId: "debug-session",
      runId: "login-pre",
      hypothesisId: "A",
      location: "server/index.ts:middleware",
      message: "Request hit /api/login",
      data: { method: req.method, origin: req.headers.origin, host: req.headers.host },
      timestamp: Date.now(),
    });
  }
  next();
});
// #endregion

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

  // #region agent log
  // Ensure log dir exists and write a boot marker so we can prove this server is running.
  await mkdir("/Users/bobbyc/Downloads/MarketingOS 2/.cursor", { recursive: true }).catch(() => {});
  agentAppendLog({
    sessionId: "debug-session",
    runId: "login-pre",
    hypothesisId: "Z",
    location: "server/index.ts:boot",
    message: "Server boot",
    data: { nodeEnv: process.env.NODE_ENV || null, port: process.env.PORT || null },
    timestamp: Date.now(),
  });
  // #endregion
  
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
  // Start scheduled marketing broadcasts (every minute)
  startMarketingBroadcastScheduler();
  // Start marketing series processor (every 15 minutes)
  startSeriesProcessor();
  // Start general background jobs (invoices, meeting reminders)
  startBackgroundJobs();
  // Start lead automation processor (abandoned cart reminders, etc)
  startLeadAutomationProcessor();

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
