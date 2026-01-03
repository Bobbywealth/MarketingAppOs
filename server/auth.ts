// Username/Password Authentication (works on Render and any deployment platform)
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { pool } from "./db";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { UserRole, rolePermissions } from "./rbac";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Export comparePasswords so it can be used in routes
export { comparePasswords };

export function setupAuth(app: Express) {
  // Ensure SESSION_SECRET is set
  if (!process.env.SESSION_SECRET) {
    console.error("❌ CRITICAL: SESSION_SECRET is not set in environment variables!");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  // Ensure presence column exists to avoid login errors on upgraded schemas
  pool
    .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;`)
    .then(() => console.log('✅ ensured users.last_seen exists'))
    .catch((e) => console.error('⚠️ could not ensure users.last_seen:', e.message));
  
  // Ensure password reset columns exist
  pool
    .query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `)
    .then(() => console.log('✅ ensured password reset columns exist'))
    .catch((e) => console.error('⚠️ could not ensure password reset columns:', e.message));

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN || undefined, // e.g. .marketingteam.app
      maxAge: sessionTtl,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Security: Force all self-registrations to "staff" role to prevent privilege escalation
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
        role: "staff", // Always assign "staff" role, admins must be created by existing admins
      });

      // Send welcome email
      if (user.email) {
        try {
          const { emailNotifications } = await import("./emailService.js");
          void emailNotifications.sendWelcomeEmail(
            user.firstName || user.username,
            user.email
          ).catch(err => console.error("Failed to send welcome email:", err));
          
          // Also notify admins about new user registration via email
          const allUsers = await storage.getUsers();
          const adminEmails = allUsers
            .filter(u => u.role === UserRole.ADMIN && u.email)
            .map(u => u.email as string);
          
          if (adminEmails.length > 0) {
            // Filter admins who have email notifications enabled
            const adminsToNotify = [];
            for (const admin of allUsers.filter(u => u.role === UserRole.ADMIN && u.email)) {
              const prefs = await storage.getUserNotificationPreferences(admin.id);
              if (prefs?.emailNotifications !== false) {
                adminsToNotify.push(admin.email as string);
              }
            }
            
            if (adminsToNotify.length > 0) {
              void emailNotifications.sendNewUserAlertToAdmins(
                adminsToNotify,
                user.username,
                user.email,
                user.role
              ).catch(err => console.error("Failed to send new user admin email alert:", err));
            }
          }
        } catch (emailErr) {
          console.error("Error sending user registration emails:", emailErr);
        }
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
          customPermissions: user.customPermissions,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('🔐 Login attempt', { origin: req.headers.origin, host: req.headers.host, cookieDomain: process.env.COOKIE_DOMAIN });
    passport.authenticate("local", async (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        // Track failed login attempt
        try {
          const { notifyAdminsAboutSecurityEvent } = await import('./routes/common.js');
          await notifyAdminsAboutSecurityEvent(
            '🚨 Failed Login Attempt',
            `Failed login attempt from IP: ${req.ip} with username: ${req.body.username || 'unknown'}`,
            'security'
          );
        } catch (notifError) {
          console.error('Failed to send security notification:', notifError);
        }
        
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Log the login activity
        try {
          await storage.createActivityLog({
            userId: user.id,
            activityType: "login",
            description: `${user.username} logged in`,
            metadata: {
              ip: req.ip,
              userAgent: req.get('user-agent'),
            },
          });
        } catch (error) {
          console.error("Failed to log activity:", error);
        }
        
        res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
          customPermissions: user.customPermissions,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    })(req, res, next);
  });

  // Support both GET and POST for logout
  const handleLogout = async (req: any, res: any, next: any) => {
    const user = req.user as SelectUser;
    
    // Log the logout activity before destroying session
    if (user) {
      try {
        await storage.createActivityLog({
          userId: user.id,
          activityType: "logout",
          description: `${user.username} logged out`,
          metadata: {
            ip: req.ip,
          },
        });
      } catch (error) {
        console.error("Failed to log logout activity:", error);
      }
    }
    
    req.logout((err: any) => {
      if (err) return next(err);
      req.session.destroy((err: any) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        // Redirect for GET, return status for POST
        if (req.method === 'GET') {
          // Check if request is from PWA
          const isPWA = req.query.pwa === 'true';
          const redirectUrl = isPWA ? '/pwa-home' : '/';
          res.redirect(redirectUrl);
        } else {
          res.sendStatus(200);
        }
      });
    });
  };

  app.get("/api/logout", handleLogout);
  app.post("/api/logout", handleLogout);

  // Password reset request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }

      // Generate reset token (random string)
      const resetToken = randomBytes(20).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in DB
      await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);

      // In a real app, you'd send an email here
      const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      console.log(`
   ═══════════════════════════════════════════════
   🔐 PASSWORD RESET REQUEST
   ═══════════════════════════════════════════════
   User: ${user.username}
   Email: ${email}
   Reset Token: ${resetToken}
   Expires: ${resetTokenExpiry.toLocaleString()}
   
   Reset URL: ${resetUrl}
   ═══════════════════════════════════════════════
      `);

      // Actually try to send the email if email service is configured
      try {
        const { emailNotifications } = await import("./emailService.js");
        await emailNotifications.sendPasswordResetEmail(email, resetUrl);
      } catch (emailErr) {
        console.error("Failed to send password reset email:", emailErr);
      }

      res.json({ 
        message: "If that email exists, a reset link has been sent.",
        // For development, include token (REMOVE IN PRODUCTION!)
        ...(process.env.NODE_ENV === 'development' && { token: resetToken })
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process password reset" });
    }
  });

  // Password reset confirmation
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Password reset token is invalid or has expired." });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);

      // Log the password change activity
      try {
        await storage.createActivityLog({
          userId: user.id,
          activityType: "password_reset",
          description: `${user.username} reset their password`,
          metadata: {
            ip: req.ip,
          },
        });
      } catch (error) {
        console.error("Failed to log password reset activity:", error);
      }
      
      res.json({ message: "Password reset successful. You can now login with your new password." });
    } catch (error) {
      console.error("Password reset confirmation error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    const permissions = rolePermissions[user.role as UserRole] || rolePermissions[UserRole.STAFF];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      customPermissions: user.customPermissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions,
    });
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
