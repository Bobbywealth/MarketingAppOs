import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { initializeStripe } from "./stripeService";
import { initializeEmailService } from "./emailService";
import { initializeEmailParser } from "./emailParser";
import { startEmailSyncService } from "./emailSyncService";
import { startVisitsAutomation } from "./visitsAutomation";
import { storage } from "./storage";
import { pool } from './db';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
  
  // Initialize services
  initializeStripe();
  initializeEmailService();
  initializeEmailParser();
  // Ensure new columns exist before auth/routes run
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;`);
    log('ensured users.last_seen exists');
  } catch (e: any) {
    log(`could not ensure users.last_seen: ${e?.message || e}`);
  }
  // Sprint 1: sales security + pipeline fields (safe guards, avoids runtime schema drift issues)
  try {
    await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_id VARCHAR;`);
    await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;`);
    await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS sales_agent_id INTEGER REFERENCES users(id);`);
    await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_manager_id INTEGER REFERENCES users(id);`);
    await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_status VARCHAR DEFAULT 'current';`);
    await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_post_date TIMESTAMP;`);
    await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMP;`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS decision_maker_name VARCHAR;`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_location_address TEXT;`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS close_reason VARCHAR;`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS package_id VARCHAR;`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_start_date TIMESTAMP;`);
    log('ensured sprint1 client/lead columns exist');
  } catch (e: any) {
    log(`could not ensure sprint1 columns: ${e?.message || e}`);
  }

  // Creators + Visits modules (required)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS creators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        home_city TEXT,
        base_zip TEXT,
        service_zip_codes TEXT[],
        service_radius_miles INTEGER,
        rate_per_visit_cents INTEGER NOT NULL,
        availability_notes TEXT,
        status VARCHAR NOT NULL DEFAULT 'active',
        performance_score NUMERIC(2,1) DEFAULT 5.0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_creators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
        role VARCHAR NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        unassigned_at TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS creator_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
        scheduled_start TIMESTAMP NOT NULL,
        scheduled_end TIMESTAMP NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'scheduled',
        completed_at TIMESTAMP,
        upload_received BOOLEAN NOT NULL DEFAULT FALSE,
        upload_timestamp TIMESTAMP,
        upload_links JSONB DEFAULT '[]'::jsonb,
        upload_due_at TIMESTAMP,
        upload_overdue BOOLEAN NOT NULL DEFAULT FALSE,
        approved BOOLEAN NOT NULL DEFAULT FALSE,
        approved_by INTEGER REFERENCES users(id),
        quality_score INTEGER,
        payment_released BOOLEAN NOT NULL DEFAULT FALSE,
        payment_released_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS visit_id UUID;`).catch(() => {});
    // Add FK constraint if missing (best-effort)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
            AND table_name = 'content_posts'
            AND constraint_name = 'content_posts_visit_id_fkey'
        ) THEN
          ALTER TABLE content_posts
            ADD CONSTRAINT content_posts_visit_id_fkey
            FOREIGN KEY (visit_id) REFERENCES creator_visits(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `).catch(() => {});
    log('ensured creators/visits tables + content_posts.visit_id exist');
  } catch (e: any) {
    log(`could not ensure creators/visits schema: ${e?.message || e}`);
  }
  
  await setupAuth(app);
  registerRoutes(app);

  // Start background email sync service (syncs every 30 minutes)
  startEmailSyncService(storage);
  // Start overdue upload automation (hourly)
  startVisitsAutomation();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
