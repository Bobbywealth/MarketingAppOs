import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { ObjectStorageService } from "./objectStorage";
import { requireRole, requirePermission, UserRole, rolePermissions } from "./rbac";
import { AuditService } from "./auditService";
import { InstagramService } from "./instagramService";
import { createCheckoutSession } from "./stripeService";
import { dialpadService } from "./dialpadService";
import {
  insertClientSchema,
  insertCampaignSchema,
  insertTaskSchema,
  insertTaskCommentSchema,
  insertLeadSchema,
  insertContentPostSchema,
  insertInvoiceSchema,
  insertTicketSchema,
  insertMessageSchema,
  insertClientDocumentSchema,
  insertWebsiteProjectSchema,
  insertProjectFeedbackSchema,
  insertAnalyticsMetricSchema,
  insertLeadActivitySchema,
  insertLeadAutomationSchema,
} from "@shared/schema";
import { z, ZodError } from "zod";
import Stripe from "stripe";
import * as microsoftAuth from "./microsoftAuth";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const objectStorageService = new ObjectStorageService();

// Initialize Stripe if keys are present
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
  });
}

function handleValidationError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Validation error", errors: error.errors });
  }
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!existsSync(uploadDir)) {
  fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
}

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

export function registerRoutes(app: Express) {
  // File upload endpoint
  app.post("/api/upload", isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: "Upload failed", 
        error: error.message 
      });
    }
  });

  // Create Stripe Checkout Session for package purchase
  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { packageId, leadId, email, name } = req.body;

      if (!packageId || !email || !name) {
        return res.status(400).json({ message: "Missing required fields: packageId, email, name" });
      }

      // Get the package details
      const pkg = await storage.getSubscriptionPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Get the app's base URL
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // Create Stripe checkout session
      const session = await createCheckoutSession({
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        clientEmail: email,
        clientName: name,
        leadId,
        successUrl: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/signup?canceled=true`,
      });

      res.json({
        success: true,
        checkoutUrl: session.checkoutUrl,
        sessionId: session.sessionId,
      });
    } catch (error: any) {
      console.error('Checkout session creation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create checkout session",
      });
    }
  });

  // File download/serve endpoint
  app.get("/uploads/:filename", async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadDir, filename);

      // Check if file exists
      if (!existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Get file stats for size and modified date
      const stats = await fs.stat(filePath);
      
      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // If download query param is present, force download
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }

      // Stream the file
      res.sendFile(filePath);
    } catch (error: any) {
      console.error('Download error:', error);
      res.status(500).json({ 
        message: "Failed to download file", 
        error: error.message 
      });
    }
  });

  // Early lead capture endpoint (captures lead after step 2)
  app.post("/api/early-lead", async (req: Request, res: Response) => {
    try {
      const earlyLeadSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        company: z.string().min(1),
        website: z.string().optional(),
        industry: z.string().optional(),
      });

      const data = earlyLeadSchema.parse(req.body);

      // Check if lead with this email already exists
      let existingLead = null;
      try {
        const existingLeads = await storage.getLeads();
        existingLead = existingLeads.find(l => l.email === data.email);
      } catch (getLeadsError) {
        console.error('⚠️ Error fetching existing leads, continuing with creation:', getLeadsError);
        // Continue anyway - we'll handle duplicates if they occur
      }

      if (existingLead) {
        // Lead already exists, don't create duplicate
        return res.json({ success: true, leadId: existingLead.id, duplicate: true });
      }

      // Create early lead capture
      const leadData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website || null,
        source: "website",
        stage: "prospect",
        score: "warm", // warm lead since they started signup
        value: null,
        notes: `⏳ EARLY LEAD CAPTURE (Step 2/3)

🎯 Source: Website Signup Form - IN PROGRESS
Lead started the account creation process but hasn't completed yet.

📋 COMPANY INFO:
• Website: ${data.website || 'Not provided'}
• Industry: ${data.industry || 'Not specified'}

⚠️ This lead is in progress - follow up to encourage completion!
🎯 They're interested in marketing services.

---
This lead will be updated if they complete the full signup process.`,
        assignedToId: null,
        sourceMetadata: { type: "signup_early_capture", step: 2 },
        nextFollowUp: null,
      };

      // Only add clientId if the column exists (for backwards compatibility)
      // This will be handled by the migration eventually
      try {
        leadData.clientId = null;
      } catch (e) {
        // clientId column doesn't exist yet, skip it
      }

      console.log('📝 Creating early lead with data:', leadData);
      const lead = await storage.createLead(leadData);
      console.log('✅ Early lead created successfully:', lead.id);
      
      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      console.error('❌ Early lead capture error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
      });
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create lead. Please try again." 
      });
    }
  });

  // Public social media audit endpoint (no authentication required)
  app.post("/api/social-audit", async (req: Request, res: Response) => {
    try {
      const auditSchema = z.object({
        website: z.string().url("Must be a valid URL"),
        instagramUrl: z.string().optional(),
        tiktokUrl: z.string().optional(),
        facebookUrl: z.string().optional(),
      });

      const data = auditSchema.parse(req.body);
      console.log('🔍 Running social media audit for:', data.website);

      // Generate audit report using existing AuditService
      const auditReport = await AuditService.generateAuditReport({
        website: data.website,
        socialPlatforms: [],
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        tiktokUrl: data.tiktokUrl,
        linkedinUrl: "",
        twitterUrl: "",
        youtubeUrl: "",
      });

      console.log('✅ Social media audit completed');
      res.json({
        success: true,
        ...auditReport,
      });
    } catch (error) {
      console.error('❌ Social media audit error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to complete audit. Please try again.",
      });
    }
  });

  // Simplified signup endpoint (no audit, direct to package selection)
  app.post("/api/signup-simple", async (req: Request, res: Response) => {
    try {
      const signupSchema = z.object({
        company: z.string().min(1),
        website: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        services: z.array(z.string()).min(1),
        budget: z.string().optional(),
        webDevType: z.string().optional(),
        webDevFeatures: z.array(z.string()).optional(),
        webDevTimeline: z.string().optional(),
        webDevBudget: z.string().optional(),
        appPlatforms: z.array(z.string()).optional(),
        appType: z.string().optional(),
        appFeatures: z.array(z.string()).optional(),
        appTimeline: z.string().optional(),
        appBudget: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = signupSchema.parse(req.body);
      console.log('📝 Processing simplified signup for:', data.email);

      // Check for existing lead and update it
      const existingLeads = await storage.getLeads();
      const existingLead = existingLeads.find(l => l.email === data.email);

      if (existingLead) {
        // Update existing lead with complete information
        const updatedNotes = `${existingLead.notes || ''}

🎯 COMPLETED SIGNUP PROCESS
Services Interested: ${data.services.join(', ')}
Budget: ${data.budget || 'Not specified'}

${data.webDevType ? `
🌐 WEB DEVELOPMENT DETAILS:
• Type: ${data.webDevType}
• Features: ${data.webDevFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.webDevTimeline || 'Not specified'}
• Budget: ${data.webDevBudget || 'Not specified'}
` : ''}

${data.appType ? `
📱 MOBILE APP DETAILS:
• Platforms: ${data.appPlatforms?.join(', ') || 'Not specified'}
• Type: ${data.appType}
• Features: ${data.appFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.appTimeline || 'Not specified'}
• Budget: ${data.appBudget || 'Not specified'}
` : ''}

${data.notes ? `
💬 ADDITIONAL NOTES:
${data.notes}
` : ''}

---
Lead completed signup process and is ready for package selection.`;

        await storage.updateLead(existingLead.id, {
          stage: "qualified",
          score: "hot",
          notes: updatedNotes,
          sourceMetadata: { 
            ...existingLead.sourceMetadata,
            completedSignup: true,
            services: data.services,
            webDev: data.webDevType ? {
              type: data.webDevType,
              features: data.webDevFeatures,
              timeline: data.webDevTimeline,
              budget: data.webDevBudget
            } : undefined,
            mobileDev: data.appType ? {
              platforms: data.appPlatforms,
              type: data.appType,
              features: data.appFeatures,
              timeline: data.appTimeline,
              budget: data.appBudget
            } : undefined
          },
        });

        console.log('✅ Updated existing lead with complete signup data');
        res.json({ success: true, leadId: existingLead.id, message: "Account created successfully!" });
      } else {
        // Create new lead if none exists
        const leadData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website || null,
          source: "website",
          stage: "qualified",
          score: "hot",
          value: null,
          notes: `🎯 NEW SIGNUP - QUALIFIED LEAD

📋 COMPANY INFO:
• Website: ${data.website || 'Not provided'}
• Industry: ${data.industry || 'Not specified'}
• Company Size: ${data.companySize || 'Not specified'}

🎯 SERVICES INTERESTED:
${data.services.join(', ')}
Budget: ${data.budget || 'Not specified'}

${data.webDevType ? `
🌐 WEB DEVELOPMENT DETAILS:
• Type: ${data.webDevType}
• Features: ${data.webDevFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.webDevTimeline || 'Not specified'}
• Budget: ${data.webDevBudget || 'Not specified'}
` : ''}

${data.appType ? `
📱 MOBILE APP DETAILS:
• Platforms: ${data.appPlatforms?.join(', ') || 'Not specified'}
• Type: ${data.appType}
• Features: ${data.appFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.appTimeline || 'Not specified'}
• Budget: ${data.appBudget || 'Not specified'}
` : ''}

${data.notes ? `
💬 ADDITIONAL NOTES:
${data.notes}
` : ''}

---
This lead completed the full signup process and is ready for package selection.`,
          clientId: null,
        assignedToId: null,
          sourceMetadata: { 
            type: "signup_complete",
            services: data.services,
            webDev: data.webDevType ? {
              type: data.webDevType,
              features: data.webDevFeatures,
              timeline: data.webDevTimeline,
              budget: data.webDevBudget
            } : undefined,
            mobileDev: data.appType ? {
              platforms: data.appPlatforms,
              type: data.appType,
              features: data.appFeatures,
              timeline: data.appTimeline,
              budget: data.appBudget
            } : undefined
          },
          nextFollowUp: null,
        };

        const lead = await storage.createLead(leadData);
        console.log('✅ Created new qualified lead from complete signup');
        res.json({ success: true, leadId: lead.id, message: "Account created successfully!" });
      }
    } catch (error) {
      console.error('❌ Simplified signup error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to create account. Please try again.",
      });
    }
  });

  // Public signup endpoint (no authentication required)
  app.post("/api/signup", async (req: Request, res: Response) => {
    try {
      const signupSchema = z.object({
        company: z.string().min(1),
        website: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        services: z.array(z.string()),
        budget: z.string().optional(),
        socialPlatforms: z.array(z.string()).optional(),
        instagramUrl: z.string().optional(),
        facebookUrl: z.string().optional(),
        tiktokUrl: z.string().optional(),
        linkedinUrl: z.string().optional(),
        twitterUrl: z.string().optional(),
        youtubeUrl: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = signupSchema.parse(req.body);

      // Generate automated audit report in background
      let auditReport: any = null;
      try {
        auditReport = await AuditService.generateAuditReport({
          website: data.website,
          socialPlatforms: data.socialPlatforms,
          instagramUrl: data.instagramUrl,
          facebookUrl: data.facebookUrl,
          tiktokUrl: data.tiktokUrl,
          linkedinUrl: data.linkedinUrl,
          twitterUrl: data.twitterUrl,
          youtubeUrl: data.youtubeUrl,
        });
      } catch (auditError) {
        console.error('Audit generation failed:', auditError);
        // Continue with signup even if audit fails
      }

      // Create or update lead for sales follow-up
      // NOTE: We DO NOT create a client here - they're just a lead until they convert!
      try {
        const leadNotes = `🎯 AUTO-CREATED FROM FREE AUDIT SIGNUP - ✅ COMPLETED

📋 COMPANY INFO:
• Website: ${data.website || 'Not provided'}
• Industry: ${data.industry || 'Not specified'}
• Company Size: ${data.companySize || 'Not specified'}
• Budget: ${data.budget || 'Not specified'}
• Services Interested: ${data.services.join(', ')}

📱 SOCIAL MEDIA:
${data.instagramUrl ? `• Instagram: ${data.instagramUrl}` : ''}
${data.facebookUrl ? `• Facebook: ${data.facebookUrl}` : ''}
${data.tiktokUrl ? `• TikTok: ${data.tiktokUrl}` : ''}
${data.linkedinUrl ? `• LinkedIn: ${data.linkedinUrl}` : ''}
${data.twitterUrl ? `• Twitter: ${data.twitterUrl}` : ''}
${data.youtubeUrl ? `• YouTube: ${data.youtubeUrl}` : ''}

📊 AUDIT RESULTS ($2,500 VALUE):
• Total Issues Found: ${auditReport?.summary.totalIssues || 0}
• Critical Issues: ${auditReport?.summary.criticalIssues || 0}
${auditReport?.website ? '\n🌐 WEBSITE ISSUES:\n' + auditReport.website.recommendations.slice(0, 5).map(r => `  ${r}`).join('\n') : ''}
${auditReport?.socialMedia && auditReport.socialMedia.length > 0 ? '\n\n📱 SOCIAL MEDIA AUDIT:\n' + auditReport.socialMedia.map(s => `  ${s.platform}: ${s.isValid ? '✅ Valid' : '❌ Invalid'} ${s.stats?.followers ? `(${s.stats.followers.toLocaleString()} followers)` : ''}`).join('\n') : ''}

🔥 This lead is HOT - they completed the full audit process!

${data.notes ? `\n💬 ADDITIONAL NOTES:\n${data.notes}` : ''}`;

        // Check if early lead capture exists
        const existingLeads = await storage.getLeads();
        const existingLead = existingLeads.find(l => l.email === data.email);

        let leadId: string;
        
        if (existingLead) {
          // Update existing lead with complete information
          const leadScore = auditReport ? (auditReport.summary.totalIssues >= 5 ? "hot" : "warm") : "warm";
          await storage.updateLead(existingLead.id, {
            source: "website",
            stage: "qualified", // Upgrade stage since they completed
            score: leadScore,
            value: auditReport ? auditReport.summary.estimatedValue * 100 : 250000, // Convert to cents
            notes: leadNotes,
            sourceMetadata: { 
              type: "signup_completed", 
              services: data.services,
              auditIssues: auditReport?.summary.totalIssues || 0,
            },
          });
          leadId = existingLead.id;
          console.log(`✅ Updated existing lead ${existingLead.id} with complete audit data`);
        } else {
          // Create new lead if somehow early capture didn't work
          const leadScore = auditReport ? (auditReport.summary.totalIssues >= 5 ? "hot" : "warm") : "warm";
          const leadData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            website: data.website || null,
            source: "website",
            stage: "qualified",
            score: leadScore,
            value: auditReport ? auditReport.summary.estimatedValue * 100 : 250000, // Convert to cents
            notes: leadNotes,
            clientId: null,
            assignedToId: null,
            sourceMetadata: { 
              type: "signup_completed", 
              services: data.services,
              auditIssues: auditReport?.summary.totalIssues || 0,
            },
            nextFollowUp: null,
          };
          const newLead = await storage.createLead(leadData);
          leadId = newLead.id;
          console.log(`✅ Created new lead ${newLead.id} with complete audit data`);
        }
        
        res.json({ 
          success: true, 
          leadId: leadId,
          audit: auditReport,
        });
      } catch (leadError) {
        console.error('Failed to create/update lead:', leadError);
        // Return error since lead creation is critical now
        return res.status(500).json({ 
          success: false, 
          message: "Failed to create lead. Please try again." 
        });
      }
    } catch (error) {
      return handleValidationError(error, res);
    }
  });

  // Microsoft OAuth routes for email integration
  app.get("/api/auth/microsoft", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      // Generate auth URL with state containing user ID
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      const authUrl = await microsoftAuth.getAuthUrl(state);
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Microsoft auth:', error);
      res.status(500).json({ message: "Failed to initiate Microsoft authentication" });
    }
  });

  app.get("/api/auth/microsoft/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).send('Missing authorization code');
      }

      // Get tokens from Microsoft
      const tokenData = await microsoftAuth.getTokenFromCode(code);
      
      // Get user profile
      const profile = await microsoftAuth.getUserProfile(tokenData.accessToken);
      
      // Decode state to get user ID
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const userId = stateData.userId;

      // Save or update email account in database
      const existingAccount = await storage.getEmailAccountByUserId(userId);
      
      if (existingAccount) {
        await storage.updateEmailAccount(existingAccount.id, {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: tokenData.expiresOn,
          lastSyncedAt: new Date(),
          isActive: true,
        });
      } else {
        await storage.createEmailAccount({
          userId,
          email: profile.mail || profile.userPrincipalName,
          provider: 'microsoft',
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: tokenData.expiresOn,
          isActive: true,
          lastSyncedAt: new Date(),
        });
      }

      // Redirect back to emails page with success message
      res.redirect('/emails?connected=true');
    } catch (error) {
      console.error('Error in Microsoft callback:', error);
      res.redirect('/emails?error=auth_failed');
    }
  });

  // Email account routes
  app.get("/api/email-accounts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const accounts = await storage.getEmailAccounts(userId);
      // Don't send tokens to frontend
      const safeAccounts = accounts.map(acc => ({
        id: acc.id,
        email: acc.email,
        provider: acc.provider,
        isActive: acc.isActive,
        lastSyncedAt: acc.lastSyncedAt,
      }));
      
      res.json(safeAccounts);
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  app.delete("/api/email-accounts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteEmailAccount(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting email account:', error);
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  // Sync emails from Microsoft
  app.post("/api/emails/sync", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      console.log(`📧 Starting email sync for user ${userId}...`);
      
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive) {
        console.error(`❌ No active email account found for user ${userId}`);
        return res.status(404).json({ message: "No active email account found" });
      }

      console.log(`✓ Found email account: ${account.email}`);

      // Check if token is expired and refresh if needed
      let accessToken = account.accessToken;
      if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
        console.log(`🔄 Token expired, refreshing...`);
        const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
        accessToken = refreshed.accessToken;
        
        await storage.updateEmailAccount(account.id, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresOn,
        });
        console.log(`✓ Token refreshed successfully`);
      }

      // Fetch emails from Microsoft
      const folders = ['inbox', 'sent', 'spam'];
      let syncedCount = 0;

      for (const folder of folders) {
        console.log(`📥 Fetching emails from ${folder}...`);
        const messages = await microsoftAuth.getEmails(accessToken!, folder, 50);
        console.log(`✓ Fetched ${messages.length} emails from ${folder}`);
        
        for (const msg of messages) {
          // Check if email already exists
          const existing = await storage.getEmailByMessageId(msg.id);
          
          if (!existing) {
            await storage.createEmail({
              messageId: msg.id,
              from: msg.from?.emailAddress?.address || '',
              fromName: msg.from?.emailAddress?.name || '',
              to: msg.toRecipients?.map((r: any) => r.emailAddress.address) || [],
              cc: msg.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
              subject: msg.subject || '(No Subject)',
              body: '', // We don't store full body on initial sync
              bodyPreview: msg.bodyPreview || '',
              folder,
              isRead: msg.isRead || false,
              hasAttachments: msg.hasAttachments || false,
              receivedAt: new Date(msg.receivedDateTime),
              userId,
            });
            syncedCount++;
          }
        }
      }

      await storage.updateEmailAccount(account.id, {
        lastSyncedAt: new Date(),
      });

      console.log(`✅ Email sync completed: ${syncedCount} new emails synced`);
      res.json({ success: true, syncedCount });
    } catch (error: any) {
      console.error('❌ Error syncing emails:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        statusCode: error?.statusCode,
      });
      res.status(500).json({ 
        message: "Failed to sync emails", 
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Get emails from database
  app.get("/api/emails", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const { folder } = req.query;
      
      const emails = await storage.getEmails(userId, folder as string);
      res.json(emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  // Delete email
  app.delete("/api/emails/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteEmail(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting email:', error);
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  // Parse email for structured data extraction
  app.post("/api/emails/:id/parse", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const emailId = req.params.id;
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Get full body if not already loaded
      let emailBody = email.body;
      if (!emailBody || emailBody.length === 0) {
        const account = await storage.getEmailAccountByUserId(userId);
        if (account && account.isActive && email.messageId) {
          let accessToken = account.accessToken;
          if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
            const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
            accessToken = refreshed.accessToken;
            await storage.updateEmailAccount(account.id, {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiresAt: refreshed.expiresOn,
            });
          }
          const fullEmail = await microsoftAuth.getEmailById(accessToken!, email.messageId);
          emailBody = fullEmail.body?.content || email.bodyPreview || '';
        } else {
          emailBody = email.bodyPreview || '';
        }
      }

      // Use email parser
      const { parseEmailContent } = await import('./emailParser');
      const parsedData = await parseEmailContent(email.subject, emailBody);

      res.json(parsedData);
    } catch (error: any) {
      console.error('Email parsing error:', error);
      res.status(500).json({ 
        message: "Failed to parse email",
        error: error.message 
      });
    }
  });

  // Analyze email with AI
  app.post("/api/emails/:id/analyze", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const emailId = req.params.id;
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Get full body if not already loaded
      let emailBody = email.body;
      if (!emailBody || emailBody.length === 0) {
        const account = await storage.getEmailAccountByUserId(userId);
        if (account && account.isActive && email.messageId) {
          let accessToken = account.accessToken;
          if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
            const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
            accessToken = refreshed.accessToken;
            await storage.updateEmailAccount(account.id, {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiresAt: refreshed.expiresOn,
            });
          }
          const fullEmail = await microsoftAuth.getEmailById(accessToken!, email.messageId);
          emailBody = fullEmail.body?.content || email.bodyPreview || '';
        } else {
          emailBody = email.bodyPreview || '';
        }
      }

      // Use OpenAI to analyze
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis not configured" });
      }

      const systemPrompt = `You are an email analysis assistant. Analyze the email and provide:
1. A brief summary (2-3 sentences)
2. Sentiment (positive, neutral, or negative)
3. Action items (if any)
4. Categories/tags (e.g., finance, support, marketing, sales, urgent)
5. Priority (low, normal, high, urgent)
6. Key points (bullet list)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief summary here",
  "sentiment": "positive|neutral|negative",
  "actionItems": ["action 1", "action 2"],
  "categories": ["category1", "category2"],
  "priority": "low|normal|high|urgent",
  "keyPoints": ["point 1", "point 2"]
}`;

      const userPrompt = `Subject: ${email.subject}
From: ${email.from}
Body: ${emailBody.replace(/<[^>]*>/g, '').substring(0, 3000)}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      res.json({
        success: true,
        analysis,
        email: {
          id: email.id,
          subject: email.subject,
          from: email.from,
        }
      });
    } catch (error: any) {
      console.error('Error analyzing email:', error);
      res.status(500).json({ 
        message: "Failed to analyze email",
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Fetch full email body from Microsoft
  app.get("/api/emails/:id/body", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const emailId = req.params.id;
      
      // Get the email from database
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      // If body already exists, return it
      if (email.body && email.body.length > 0) {
        return res.json({ body: email.body });
      }
      
      // Fetch from Microsoft Graph API
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive || !email.messageId) {
        return res.status(404).json({ message: "Cannot fetch email body" });
      }
      
      // Check token expiry
      let accessToken = account.accessToken;
      if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
        const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
        accessToken = refreshed.accessToken;
        
        await storage.updateEmailAccount(account.id, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresOn,
        });
      }
      
      // Fetch full email from Microsoft
      const fullEmail = await microsoftAuth.getEmailById(accessToken!, email.messageId);
      const bodyContent = fullEmail.body?.content || email.bodyPreview || '';
      
      // Store the body in database
      await storage.updateEmail(emailId, {
        body: bodyContent,
      });
      
      res.json({ body: bodyContent });
    } catch (error) {
      console.error('Error fetching email body:', error);
      res.status(500).json({ message: "Failed to fetch email body" });
    }
  });

  // Send email via Microsoft
  app.post("/api/emails/send", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive) {
        return res.status(404).json({ message: "No active email account found" });
      }

      // Check token expiry
      let accessToken = account.accessToken;
      if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
        const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
        accessToken = refreshed.accessToken;
        
        await storage.updateEmailAccount(account.id, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresOn,
        });
      }

      const emailData = req.body;
      await microsoftAuth.sendEmail(accessToken!, emailData);

      // Store sent email in database
      await storage.createEmail({
        from: account.email,
        fromName: account.email,
        to: emailData.to,
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        subject: emailData.subject,
        body: emailData.body,
        bodyPreview: emailData.body.substring(0, 150),
        folder: 'sent',
        isRead: true,
        hasAttachments: false,
        sentAt: new Date(),
        userId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Dashboard stats - OPTIMIZED
  app.get("/api/dashboard/stats", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      // Only fetch lightweight data and minimal records for activity feed
      const [clients, campaigns, leads, tasks, activityLogs] = await Promise.all([
        storage.getClients(), // Small dataset, usually < 100 records
        storage.getCampaigns(), // Small dataset
        storage.getLeads(), // Could be large, but we need value calc
        storage.getTasks(), // Could be large
        storage.getActivityLogs(15), // Only get 15 recent logs
      ]);

      console.log("📊 Dashboard Stats (Optimized):");
      console.log("  - Total Clients:", clients.length);
      console.log("  - Total Campaigns:", campaigns.length);
      console.log("  - Total Leads:", leads.length);
      console.log("  - Total Tasks:", tasks.length);

      // Quick counts and aggregates
      const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
      const pipelineValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      
      // Skip invoices for now - not critical for dashboard load
      const monthlyRevenue = 0; // Will be replaced by Stripe data if available

      // Task metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === "completed").length;
      const pendingTasks = tasks.filter((t) => t.status === "todo").length;
      const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
      const reviewTasks = tasks.filter((t) => t.status === "review").length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Today's task metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tasksToday = tasks.filter((t) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        // Set to start of day for comparison
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });

      const totalTasksToday = tasksToday.length;
      const completedTasksToday = tasksToday.filter((t) => t.status === "completed").length;
      const todoTasksToday = tasksToday.filter((t) => t.status === "todo").length;
      const inProgressTasksToday = tasksToday.filter((t) => t.status === "in_progress").length;
      const reviewTasksToday = tasksToday.filter((t) => t.status === "review").length;

      // Recent Activity Feed - OPTIMIZED: Only use most recent data to avoid slow sorting
      const recentActivity: any[] = [];
      
      // Quick recent items only (first 3 of each)

      // Simplified activity feed - only most recent items (reduced from sorting everything)
      clients.slice(0, 2).forEach(client => {
        recentActivity.push({
          type: 'success',
          title: `Client: ${client.name}`,
          time: formatActivityTime(client.createdAt),
          timestamp: client.createdAt,
        });
      });

      campaigns.slice(0, 2).forEach(campaign => {
        recentActivity.push({
          type: 'info',
          title: `Campaign: ${campaign.name}`,
          time: formatActivityTime(campaign.createdAt),
          timestamp: campaign.createdAt,
        });
      });

      tasks.filter(t => t.status === 'completed').slice(0, 2).forEach(task => {
        recentActivity.push({
          type: 'success',
          title: `Task completed: ${task.title}`,
          time: formatActivityTime(task.updatedAt),
          timestamp: task.updatedAt,
        });
      });

      // Website project activities
      [...websiteProjects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 3)
        .forEach(project => {
          const client = clients.find(c => c.id === project.clientId);
          recentActivity.push({
            type: 'info',
            title: `Website project ${project.stage}: ${project.name}${client ? ` for ${client.name}` : ''}`,
            time: formatActivityTime(project.updatedAt || project.createdAt),
            timestamp: project.updatedAt || project.createdAt,
          });
        });

      // Activity logs (logins, payments, etc.)
      activityLogs.forEach(log => {
        const typeMap: any = {
          'login': 'success',
          'logout': 'info',
          'payment': 'success',
          'client_added': 'success',
          'task_completed': 'success',
        };
        recentActivity.push({
          type: typeMap[log.activityType] || 'info',
          title: log.description,
          time: formatActivityTime(log.createdAt),
          timestamp: log.createdAt,
        });
      });

      // Sort by timestamp (most recent first) and limit to 10
      const sortedActivity = recentActivity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      // Upcoming Deadlines
      const upcomingDeadlines: any[] = [];
      
      // Tasks with due dates
      tasks
        .filter(t => t.dueDate && t.status !== 'completed')
        .forEach(task => {
          const daysUntil = Math.floor((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          upcomingDeadlines.push({
            title: task.title,
            date: formatDeadlineDate(task.dueDate),
            urgent: daysUntil <= 3,
            timestamp: task.dueDate,
          });
        });

      // Sort deadlines by date and limit to 5
      const sortedDeadlines = upcomingDeadlines
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, 5);

      res.json({
        totalClients: clients.length,
        activeCampaigns,
        pipelineValue,
        monthlyRevenue,
        recentActivity: sortedActivity,
        upcomingDeadlines: sortedDeadlines,
        taskMetrics: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          completionPercentage,
        },
        // Today's task metrics
        totalTasksToday,
        completedTasksToday,
        todoTasksToday,
        inProgressTasksToday,
        reviewTasksToday,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Helper functions for formatting
  function formatActivityTime(date: Date | null | undefined): string {
    if (!date) return 'Just now';
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return activityDate.toLocaleDateString();
  }

  function formatDeadlineDate(date: Date | null | undefined): string {
    if (!date) return '';
    const deadline = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((deadline.getTime() - now.getTime()) / 86400000);

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    return `Due ${deadline.toLocaleDateString()}`;
  }

  // Stripe subscription stats
  app.get("/api/stripe/subscriptions", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      // Fetch all subscriptions from Stripe (without expanding to avoid PII leaks)
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
      });

      // Calculate metrics
      const activeSubscriptions = subscriptions.data.filter(sub => sub.status === 'active');
      
      // Calculate MRR properly: sum all items, account for quantity and interval
      const mrr = activeSubscriptions.reduce((sum, sub) => {
        const subscriptionMrr = sub.items.data.reduce((itemSum, item) => {
          const unitAmount = (item.price.unit_amount || 0) / 100;
          const quantity = item.quantity || 1;
          const interval = item.price.recurring?.interval;
          
          // Convert to monthly
          let monthlyAmount = unitAmount * quantity;
          if (interval === 'year') {
            monthlyAmount = monthlyAmount / 12;
          } else if (interval !== 'month') {
            monthlyAmount = 0; // Ignore non-monthly/yearly intervals
          }
          
          return itemSum + monthlyAmount;
        }, 0);
        
        return sum + subscriptionMrr;
      }, 0);

      res.json({
        totalSubscriptions: subscriptions.data.length,
        activeSubscriptions: activeSubscriptions.length,
        mrr,
        subscriptions: subscriptions.data.map(sub => {
          const firstItem = sub.items.data[0];
          return {
            id: sub.id,
            customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || '',
            status: sub.status,
            amount: (firstItem?.price?.unit_amount || 0) / 100,
            interval: firstItem?.price?.recurring?.interval,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          };
        }),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch Stripe subscriptions" });
    }
  });

  // Get subscription for a specific client
  app.get("/api/stripe/client/:clientId/subscription", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const client = await storage.getClient(req.params.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (!client.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripe.subscriptions.retrieve(client.stripeSubscriptionId, {
        expand: ['customer', 'latest_invoice'],
      });

      res.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          amount: (subscription.items.data[0]?.price?.unit_amount || 0) / 100,
          interval: subscription.items.data[0]?.price?.recurring?.interval,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          customer: subscription.customer,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch client subscription" });
    }
  });

  // Client routes
  app.get("/api/clients", isAuthenticated, requirePermission("canManageClients"), async (_req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      console.log("Received client data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertClientSchema.parse(req.body);
      console.log("Validated client data:", JSON.stringify(validatedData, null, 2));
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      handleValidationError(error, res);
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.partial().strip().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      res.json(client);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", isAuthenticated, requirePermission("canManageCampaigns"), async (_req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertCampaignSchema.partial().strip().parse(req.body);
      const campaign = await storage.updateCampaign(req.params.id, validatedData);
      res.json(campaign);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Task Spaces routes
  app.get("/api/task-spaces", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const spaces = await storage.getTaskSpaces();
      res.json(spaces);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch task spaces" });
    }
  });

  app.post("/api/task-spaces", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      // Ensure userId is a valid integer
      const parsedUserId = typeof userId === 'number' ? userId : parseInt(userId);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const spaceData = { ...req.body, createdBy: parsedUserId };
      console.log("Creating task space:", spaceData);
      const space = await storage.createTaskSpace(spaceData);
      res.status(201).json(space);
    } catch (error) {
      console.error("Task space creation error:", error);
      res.status(500).json({ message: "Failed to create task space" });
    }
  });

  app.patch("/api/task-spaces/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const space = await storage.updateTaskSpace(req.params.id, req.body);
      res.json(space);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update task space" });
    }
  });

  app.delete("/api/task-spaces/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      await storage.deleteTaskSpace(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete task space" });
    }
  });

  // Get tasks by space
  app.get("/api/task-spaces/:id/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasksBySpace(req.params.id);
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch tasks for space" });
    }
  });

  // User View Preferences routes
  app.get("/api/user-preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const preferences = await storage.getUserViewPreferences(userId);
      res.json(preferences || null);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/user-preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const preferences = await storage.upsertUserViewPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to save user preferences" });
    }
  });

  // Task routes (admin and staff only)
  app.get("/api/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      console.log("📥 Backend received task data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertTaskSchema.parse(req.body);
      console.log("✅ Validation passed, creating task:", validatedData);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("❌ Task creation error:", error);
      handleValidationError(error, res);
    }
  });

  // AI-powered task parsing from natural language
  app.post("/api/tasks/parse-ai", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const { input } = req.body;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ message: "Input text is required" });
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          message: "AI assistant not configured. Please add OPENAI_API_KEY to environment variables." 
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get clients and users for context
      const [clients, users] = await Promise.all([
        storage.getClients(),
        storage.getUsers(),
      ]);

      const systemPrompt = `You are a task parsing assistant. Extract task details from natural language.

Available clients: ${clients.map(c => `${c.name} (ID: ${c.id})`).join(', ')}
Available users: ${users.map(u => `${u.username} (ID: ${u.id})`).join(', ')}

Return JSON with:
- title: string (required)
- description: string (optional)
- priority: "low" | "normal" | "high" | "urgent" (default: "normal")
- status: "todo" | "in_progress" | "review" | "completed" (default: "todo")
- dueDate: ISO date string (optional, parse relative dates like "tomorrow", "next Friday", etc.)
- clientId: string (optional, match from available clients)
- assignedToId: string (optional, match from available users)

Examples:
"Call Bobby tomorrow about website" -> {"title":"Call Bobby about website","dueDate":"2025-10-16","priority":"normal"}
"High priority: Fix login bug ASAP" -> {"title":"Fix login bug","priority":"urgent","status":"todo"}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Transform the parsed data - convert date string to Date object if present
      const transformedData = {
        ...parsed,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
        assignedToId: parsed.assignedToId ? parseInt(parsed.assignedToId) : undefined,
      };
      
      // Validate the transformed data
      const taskData = insertTaskSchema.parse(transformedData);
      
      res.json({
        success: true,
        taskData,
        originalInput: input,
      });

    } catch (error: any) {
      console.error("AI parsing error:", error);
      if (error.message?.includes('API key')) {
        return res.status(503).json({ message: "OpenAI API configuration error" });
      }
      res.status(500).json({ 
        message: "Failed to parse task with AI", 
        error: error.message 
      });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.partial().strip().parse(req.body);
      
      // Check if task is being marked as completed and is recurring
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const task = await storage.updateTask(req.params.id, validatedData);

      // If task is recurring and was just completed, create next instance
      if (
        existingTask.isRecurring && 
        validatedData.status === "completed" && 
        existingTask.status !== "completed"
      ) {
        console.log("🔄 Creating recurring task instance for:", existingTask.title);
        
        // Calculate next due date based on recurrence pattern
        let nextDueDate: Date | null = null;
        if (existingTask.dueDate && existingTask.recurringPattern && existingTask.recurringInterval) {
          const currentDueDate = new Date(existingTask.dueDate);
          nextDueDate = new Date(currentDueDate);
          
          switch (existingTask.recurringPattern) {
            case "daily":
              nextDueDate.setDate(currentDueDate.getDate() + existingTask.recurringInterval);
              break;
            case "weekly":
              nextDueDate.setDate(currentDueDate.getDate() + (existingTask.recurringInterval * 7));
              break;
            case "monthly":
              nextDueDate.setMonth(currentDueDate.getMonth() + existingTask.recurringInterval);
              break;
            case "yearly":
              nextDueDate.setFullYear(currentDueDate.getFullYear() + existingTask.recurringInterval);
              break;
          }

          // Check if we've exceeded the recurring end date
          if (existingTask.recurringEndDate && nextDueDate > new Date(existingTask.recurringEndDate)) {
            console.log("⏸️ Recurring task has reached end date, not creating new instance");
          } else {
            // Create new task instance
            await storage.createTask({
              title: existingTask.title,
              description: existingTask.description,
              status: "todo",
              priority: existingTask.priority,
              dueDate: nextDueDate,
              clientId: existingTask.clientId,
              assignedToId: existingTask.assignedToId,
              isRecurring: true,
              recurringPattern: existingTask.recurringPattern,
              recurringInterval: existingTask.recurringInterval,
              recurringEndDate: existingTask.recurringEndDate,
            });
            console.log("✅ New recurring task instance created for:", nextDueDate.toDateString());
          }
        }
      }

      res.json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Calendar Events routes
  app.get("/api/calendar/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const events = await storage.getCalendarEvents();
      res.json(events);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      const eventData = {
        ...req.body,
        createdBy: userId,
        start: new Date(req.body.start),
        end: new Date(req.body.end),
      };

      const event = await storage.createCalendarEvent(eventData);
      res.status(201).json(event);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || "Failed to create calendar event" });
    }
  });

  app.patch("/api/calendar/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const event = await storage.updateCalendarEvent(req.params.id, req.body);
      res.json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteCalendarEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Task comment routes
  app.get("/api/tasks/:taskId/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getTaskComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch task comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const validatedData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId: user.claims.sub,
      });
      const comment = await storage.createTaskComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Lead routes
  app.get("/api/leads", isAuthenticated, requirePermission("canManageLeads"), async (_req: Request, res: Response) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/leads/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadSchema.partial().strip().parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      res.json(lead);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Lead activity routes
  app.get("/api/leads/:leadId/activities", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const activities = await storage.getLeadActivities(req.params.leadId);
      res.json(activities);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead activities" });
    }
  });

  app.post("/api/leads/:leadId/activities", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const { insertLeadActivitySchema } = await import("@shared/schema");
      const validatedData = insertLeadActivitySchema.parse({
        ...req.body,
        leadId: req.params.leadId,
      });
      const activity = await storage.createLeadActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Lead automation routes
  app.get("/api/leads/:leadId/automations", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const automations = await storage.getLeadAutomations(req.params.leadId);
      res.json(automations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead automations" });
    }
  });

  app.post("/api/leads/:leadId/automations", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const { insertLeadAutomationSchema } = await import("@shared/schema");
      const validatedData = insertLeadAutomationSchema.parse({
        ...req.body,
        leadId: req.params.leadId,
      });
      const automation = await storage.createLeadAutomation(validatedData);
      res.status(201).json(automation);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const { insertLeadAutomationSchema } = await import("@shared/schema");
      const validatedData = insertLeadAutomationSchema.partial().strip().parse(req.body);
      const automation = await storage.updateLeadAutomation(req.params.id, validatedData);
      res.json(automation);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update automation" });
    }
  });

  app.delete("/api/automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      await storage.deleteLeadAutomation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete automation" });
    }
  });

  // Content post routes
  app.get("/api/content-posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userRole = user?.role || 'staff';
      const clientId = user?.clientId;
      
      // If user is a client, only show their assigned content
      if (userRole === 'client' && clientId) {
        const posts = await storage.getContentPostsByClient(clientId);
        return res.json(posts);
      }
      
      // For non-clients, require permission and show all posts
      if (!user || !rolePermissions[userRole as UserRole]?.permissions?.canManageContent) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const posts = await storage.getContentPosts();
      res.json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch content posts" });
    }
  });

  app.post("/api/content-posts", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      console.log("Creating content post with data:", req.body);
      const validatedData = insertContentPostSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const post = await storage.createContentPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Content post creation error:", error);
      return handleValidationError(error, res);
    }
  });

  app.patch("/api/content-posts/:id", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertContentPostSchema.partial().strip().parse(req.body);
      const post = await storage.updateContentPost(req.params.id, validatedData);
      res.json(post);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update content post" });
    }
  });

  app.patch("/api/content-posts/:id/approval", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      const approvalSchema = z.object({
        approvalStatus: z.enum(["pending", "approved", "rejected"])
      });
      const validatedData = approvalSchema.parse(req.body);
      const post = await storage.updateContentPost(req.params.id, validatedData);
      res.json(post);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update approval status" });
    }
  });

  app.delete("/api/content-posts/:id", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      await storage.deleteContentPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete content post" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, requirePermission("canManageInvoices"), async (_req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/invoices/:id", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertInvoiceSchema.partial().strip().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      res.json(invoice);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getTickets();
      const userRole = (req as any).userRole;
      const userId = (req as any).userId;
      
      // Clients can only see their own tickets
      if (userRole === "client") {
        const filteredTickets = tickets.filter(t => t.createdBy === userId);
        return res.json(filteredTickets);
      }
      
      res.json(tickets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.post("/api/tickets", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      
      // For clients: ensure they can only create tickets with their own clientId
      let ticketData = { ...validatedData, createdBy: userId };
      
      if (userRole === "client") {
        // Clients cannot set arbitrary clientId or assignedTo
        delete (ticketData as any).assignedTo;
        // Note: In production, you'd link user to their client record to set clientId correctly
      }
      
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/tickets/:id", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketSchema.partial().strip().parse(req.body);
      const userRole = (req as any).userRole;
      const userId = (req as any).userId;
      
      // Clients can only update their own tickets
      if (userRole === "client") {
        const tickets = await storage.getTickets();
        const ticket = tickets.find(t => t.id === req.params.id);
        if (!ticket || ticket.createdBy !== userId) {
          return res.status(403).json({ message: "Cannot update tickets created by others" });
        }
      }
      
      const ticket = await storage.updateTicket(req.params.id, validatedData);
      res.json(ticket);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete("/api/tickets/:id", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).userRole;
      const userId = (req as any).userId;
      
      // Clients can only delete their own tickets
      if (userRole === "client") {
        const tickets = await storage.getTickets();
        const ticket = tickets.find(t => t.id === req.params.id);
        if (!ticket || ticket.createdBy !== userId) {
          return res.status(403).json({ message: "Cannot delete tickets created by others" });
        }
      }
      
      await storage.deleteTicket(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Message routes (all authenticated users)
  app.get("/api/messages", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const messages = await storage.getMessages(clientId);
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get conversation between two users (for internal team messaging)
  app.get("/api/messages/conversation/:userId", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      if (!otherUserId || isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const messages = await storage.getConversation(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/messages", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      console.log("📨 Creating message:", { 
        userId: currentUserId, 
        recipientId: req.body.recipientId,
        content: req.body.content?.substring(0, 50),
        isInternal: req.body.isInternal 
      });
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        userId: currentUserId, // Set sender as current user
      });
      
      const message = await storage.createMessage(validatedData);
      console.log("✅ Message created successfully:", message.id);
      res.status(201).json(message);
    } catch (error: any) {
      console.error("❌ Failed to create message:", error);
      console.error("Request body:", req.body);
      console.error("User ID:", (req.user as any)?.id);
      handleValidationError(error, res);
    }
  });

  app.patch("/api/messages/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const validatedData = insertMessageSchema.partial().strip().parse(req.body);
      const message = await storage.updateMessage(req.params.id, validatedData);
      res.json(message);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete("/api/messages/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      await storage.deleteMessage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Onboarding task routes (admin and staff only)
  app.get("/api/onboarding-tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getOnboardingTasks();
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch onboarding tasks" });
    }
  });

  // User management routes (staff and admin only)
  app.get("/api/users", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Filter out clients - they should only appear in /clients page, not team management
      const teamMembers = users.filter(user => user.role !== 'client');
      res.json(teamMembers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const roleSchema = z.object({
        role: z.enum(["admin", "staff", "client"])
      });
      const { role } = roleSchema.parse(req.body);
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Global search route
  app.get("/api/search", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.json({
          clients: [],
          campaigns: [],
          leads: [],
          contentPosts: [],
          invoices: [],
          tickets: [],
        });
      }
      const results = await storage.globalSearch(query.trim());
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Client Document routes
  app.get("/api/clients/:clientId/documents", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const documents = await storage.getClientDocuments(req.params.clientId);
      res.json(documents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/clients/:clientId/documents", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      const requestSchema = insertClientDocumentSchema.omit({ 
        id: true, 
        createdAt: true, 
        objectPath: true, 
        uploadedBy: true,
        clientId: true,
      }).extend({
        uploadUrl: z.string(),
      });
      
      const validatedData = requestSchema.parse(req.body);
      
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        validatedData.uploadUrl,
        {
          owner: userId,
          visibility: "private",
        }
      );

      const documentData = insertClientDocumentSchema.parse({
        clientId: req.params.clientId,
        name: validatedData.name,
        description: validatedData.description,
        objectPath: objectPath,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        uploadedBy: userId,
      });

      const document = await storage.createClientDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/clients/:clientId/documents/:documentId", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteClientDocument(req.params.documentId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Website project routes
  app.get("/api/website-projects", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const projects = await storage.getWebsiteProjects();
      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch website projects" });
    }
  });

  app.get("/api/website-projects/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const project = await storage.getWebsiteProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Website project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch website project" });
    }
  });

  app.post("/api/website-projects", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertWebsiteProjectSchema.parse(req.body);
      const project = await storage.createWebsiteProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/website-projects/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertWebsiteProjectSchema.partial().parse(req.body);
      const project = await storage.updateWebsiteProject(req.params.id, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof Error && error.message === "Website project not found") {
        return res.status(404).json({ message: error.message });
      }
      handleValidationError(error, res);
    }
  });

  app.delete("/api/website-projects/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteWebsiteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete website project" });
    }
  });

  // Project feedback routes
  app.get("/api/website-projects/:projectId/feedback", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const feedback = await storage.getProjectFeedback(req.params.projectId);
      res.json(feedback);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch project feedback" });
    }
  });

  app.post("/api/website-projects/:projectId/feedback", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertProjectFeedbackSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
        userId,
      });
      const feedback = await storage.createProjectFeedback(validatedData);
      res.status(201).json(feedback);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/project-feedback/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertProjectFeedbackSchema.partial().parse(req.body);
      const feedback = await storage.updateProjectFeedback(req.params.id, validatedData);
      res.json(feedback);
    } catch (error) {
      if (error instanceof Error && error.message === "Project feedback not found") {
        return res.status(404).json({ message: error.message });
      }
      handleValidationError(error, res);
    }
  });

  app.delete("/api/project-feedback/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteProjectFeedback(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete project feedback" });
    }
  });

  // Public tracking endpoint (no auth required for website tracking)
  app.post("/api/track/pageview", async (req: Request, res: Response) => {
    try {
      const { page, referrer, userAgent } = req.body;
      
      // Store pageview data
      console.log('📊 Page view tracked:', {
        page,
        referrer,
        userAgent,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // You can store this in database for analytics
      // await storage.trackPageView({ page, referrer, userAgent, ip: req.ip });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error tracking pageview:', error);
      res.status(500).json({ message: "Failed to track pageview" });
    }
  });

  // Get website analytics summary
  app.get("/api/analytics/website", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // For now, return sample data
      // TODO: Implement actual tracking data from database
      const stats = {
        pageViews: 1250,
        uniqueVisitors: 450,
        bounceRate: 42.5,
        avgSessionDuration: 180, // in seconds
        topPages: [
          { path: '/', views: 450, title: 'Home' },
          { path: '/services', views: 230, title: 'Services' },
          { path: '/pricing', views: 180, title: 'Pricing' },
          { path: '/contact', views: 150, title: 'Contact' },
          { path: '/about', views: 120, title: 'About' },
        ],
        trafficSources: [
          { source: 'Direct', visits: 450, percentage: 36 },
          { source: 'Google', visits: 375, percentage: 30 },
          { source: 'Social Media', visits: 250, percentage: 20 },
          { source: 'Referral', visits: 175, percentage: 14 },
        ],
      };
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch website analytics" });
    }
  });

  // Analytics metrics routes
  app.get("/api/analytics/metrics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const metrics = await storage.getAnalyticsMetrics(clientId);
      res.json(metrics);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch analytics metrics" });
    }
  });

  app.post("/api/analytics/metrics", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAnalyticsMetricSchema.parse(req.body);
      const metric = await storage.createAnalyticsMetric(validatedData);
      res.status(201).json(metric);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/analytics/metrics/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteAnalyticsMetric(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete analytics metric" });
    }
  });

  // Lead activity routes
  app.get("/api/leads/:leadId/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getLeadActivities(req.params.leadId);
      res.json(activities);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead activities" });
    }
  });

  app.post("/api/leads/:leadId/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertLeadActivitySchema.parse({
        ...req.body,
        leadId: req.params.leadId,
        userId,
      });
      const activity = await storage.createLeadActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Lead automation routes
  app.get("/api/leads/:leadId/automations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const automations = await storage.getLeadAutomations(req.params.leadId);
      res.json(automations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead automations" });
    }
  });

  app.post("/api/leads/:leadId/automations", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadAutomationSchema.parse({
        ...req.body,
        leadId: req.params.leadId,
      });
      const automation = await storage.createLeadAutomation(validatedData);
      res.status(201).json(automation);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/lead-automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadAutomationSchema.partial().parse(req.body);
      const automation = await storage.updateLeadAutomation(req.params.id, validatedData);
      res.json(automation);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/lead-automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      await storage.deleteLeadAutomation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete lead automation" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", isAuthenticated, requirePermission("canManageUsers"), async (_req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Don't send password hashes to frontend
      const sanitizedUsers = users.map(({ id, username, role, createdAt }) => ({
        id,
        username,
        role,
        createdAt,
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, requirePermission("canManageUsers"), async (req: Request, res: Response) => {
    try {
      console.log("Creating user with data:", { username: req.body.username, role: req.body.role });
      
      const { hashPassword } = await import("./auth.js");
      const userData = {
        username: req.body.username,
        password: await hashPassword(req.body.password),
        role: req.body.role || "staff",
      };
      
      console.log("Hashed password, calling storage.createUser...");
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user.id);
      
      // Don't send password hash
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error: any) {
      console.error("User creation error:", error);
      console.error("Error details:", error?.message, error?.code);
      res.status(500).json({ message: error?.message || "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, requirePermission("canManageUsers"), async (req: Request, res: Response) => {
    try {
      const { role } = req.body;
      const userId = parseInt(req.params.id);
      
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      await storage.updateUser(userId, { role });
      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, requirePermission("canManageUsers"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update own profile (any authenticated user can update their own profile)
  app.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { firstName, lastName, email } = req.body;
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;

      await storage.updateUser(currentUserId, updateData);
      
      // Fetch updated user
      const updatedUser = await storage.getUsers();
      const user = updatedUser.find(u => u.id === currentUserId);
      
      res.json({ message: "Profile updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Check and create notifications for due/overdue tasks
  app.post("/api/notifications/check-tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const tasks = await storage.getTasks();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let notificationsCreated = 0;

      for (const task of tasks) {
        // Skip completed tasks
        if (task.status === 'completed') continue;
        
        // Skip if no due date
        if (!task.dueDate) continue;

        // Skip if no valid user to notify
        const targetUserId = task.assignedToId || userId;
        if (!targetUserId) continue;

        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        // Check if task is overdue
        if (dueDateOnly < today) {
          const existingNotifications = await storage.getNotifications(targetUserId);
          const alreadyNotified = existingNotifications.some(
            n => n.title.includes('Overdue') && n.message.includes(task.title)
          );
          
          if (!alreadyNotified) {
            await storage.createNotification({
              userId: targetUserId,
              type: 'alert',
              category: 'task',
              title: '🚨 Task Overdue',
              message: `Task "${task.title}" is overdue!`,
              actionUrl: '/tasks',
            });
            notificationsCreated++;
          }
        }
        // Check if task is due today
        else if (dueDateOnly.getTime() === today.getTime()) {
          const existingNotifications = await storage.getNotifications(targetUserId);
          const alreadyNotified = existingNotifications.some(
            n => n.title.includes('Due Today') && n.message.includes(task.title)
          );
          
          if (!alreadyNotified) {
            await storage.createNotification({
              userId: targetUserId,
              type: 'warning',
              category: 'task',
              title: '⏰ Task Due Today',
              message: `Task "${task.title}" is due today!`,
              actionUrl: '/tasks',
            });
            notificationsCreated++;
          }
        }
        // Check if task is due tomorrow
        else if (dueDateOnly.getTime() === tomorrow.getTime()) {
          const existingNotifications = await storage.getNotifications(task.assignedToId || userId);
          const alreadyNotified = existingNotifications.some(
            n => n.title.includes('Due Tomorrow') && n.message.includes(task.title)
          );
          
          if (!alreadyNotified) {
            await storage.createNotification({
              userId: task.assignedToId || userId,
              type: 'info',
              title: '📅 Task Due Tomorrow',
              message: `Task "${task.title}" is due tomorrow.`,
              link: '/tasks',
            });
            notificationsCreated++;
          }
        }
      }

      res.json({ 
        message: "Task notifications checked", 
        notificationsCreated 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to check task notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Create a test notification (for testing purposes)
  app.post("/api/notifications/test", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      await storage.createNotification({
        userId,
        type: 'info',
        title: '🎉 Test Notification',
        message: 'This is a test notification to verify the system is working!',
        category: 'general',
      });
      
      res.json({ message: "Test notification created" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Activity logs routes (Admin only)
  app.get("/api/activity-logs", isAuthenticated, requirePermission("canViewReports"), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activityLogs = await storage.getActivityLogs(limit);
      res.json(activityLogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // One-time database migration endpoint (Admin only)
  app.post("/api/admin/run-migration", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const { db } = await import("./db.js");
      
      // Add missing columns
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`);
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`);
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`);
      await db.execute(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`);
      
      res.json({ 
        success: true, 
        message: "Database migration completed successfully! Added email, first_name, last_name to users and display_order to clients." 
      });
    } catch (error: any) {
      console.error("Migration error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Migration failed", 
        error: error?.message 
      });
    }
  });

  // Role Permissions routes
  app.get("/api/role-permissions", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.get("/api/role-permissions/:role", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.role);
      res.json(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.put("/api/role-permissions/:role", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const permissions = await storage.updateRolePermissions(req.params.role, req.body.permissions);
      res.json(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // Stripe routes
  app.get("/api/stripe/dashboard", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const { getStripeDashboardMetrics } = await import("./stripeService.js");
      const metrics = await getStripeDashboardMetrics(start, end);
      res.json(metrics);
    } catch (error: any) {
      console.error("Stripe dashboard error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe data" });
    }
  });

  app.get("/api/stripe/customers", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const { getStripeCustomers } = await import("./stripeService.js");
      const customers = await getStripeCustomers();
      res.json(customers);
    } catch (error: any) {
      console.error("Stripe customers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe customers" });
    }
  });

  app.post("/api/stripe/invoices", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { customerId, items } = req.body;
      const { createStripeInvoice } = await import("./stripeService.js");
      const invoice = await createStripeInvoice(customerId, items);
      res.json(invoice);
    } catch (error: any) {
      console.error("Stripe invoice creation error:", error);
      res.status(500).json({ message: error.message || "Failed to create invoice" });
    }
  });

  app.get("/api/stripe/balance", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const { getStripeBalance } = await import("./stripeService.js");
      const balance = await getStripeBalance();
      res.json(balance);
    } catch (error: any) {
      console.error("Stripe balance error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe balance" });
    }
  });

  // Subscription Packages routes
  app.get("/api/subscription-packages", async (_req: Request, res: Response) => {
    try {
      const packages = await storage.getActiveSubscriptionPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch subscription packages" });
    }
  });

  // Instagram Analytics endpoints
  app.get("/api/instagram/analytics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const clientId = user?.clientId;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID required" });
      }

      // Get client's Instagram connection info
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      let instagramData = null;

      // Try to get data from connected Instagram account first
      if (client.socialLinks?.instagram && client.instagramAccessToken) {
        try {
          console.log(`📊 Fetching connected Instagram data for client ${clientId}`);
          instagramData = await InstagramService.getAccountMetrics(
            client.instagramAccessToken,
            client.instagramUserId || ''
          );
        } catch (error) {
          console.error('Failed to fetch connected Instagram data:', error);
          // Clear invalid token
          await storage.updateClient(clientId, {
            instagramAccessToken: null,
            instagramUserId: null,
            instagramConnectedAt: null,
          });
        }
      }

      // Fallback to scraping public data
      if (!instagramData && client.socialLinks?.instagram) {
        try {
          const username = client.socialLinks.instagram.split('/').pop()?.replace('@', '');
          if (username) {
            console.log(`🔍 Scraping public Instagram data for @${username}`);
            instagramData = await InstagramService.scrapePublicData(username);
          }
        } catch (error) {
          console.error('Failed to scrape Instagram data:', error);
        }
      }

      // Return mock data if no Instagram connection
      if (!instagramData) {
        instagramData = {
          followers: 0,
          following: 0,
          posts: 0,
          engagement_rate: 0,
          reach: 0,
          impressions: 0,
          profile_views: 0,
          website_clicks: 0,
          email_contacts: 0,
          phone_calls: 0,
          direction_clicks: 0,
          text_message_clicks: 0,
        };
      }

      res.json({
        platform: 'instagram',
        connected: !!client.instagramAccessToken,
        username: client.socialLinks?.instagram?.split('/').pop()?.replace('@', '') || null,
        metrics: instagramData,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching Instagram analytics:", error);
      res.status(500).json({ message: "Failed to fetch Instagram analytics" });
    }
  });

  app.get("/api/instagram/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const clientId = user?.clientId;
      const limit = parseInt(req.query.limit as string) || 12;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID required" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      let posts = [];

      // Try to get posts from connected Instagram account
      if (client.socialLinks?.instagram && client.instagramAccessToken) {
        try {
          posts = await InstagramService.getRecentPosts(
            client.instagramAccessToken,
            client.instagramUserId || '',
            limit
          );
        } catch (error) {
          console.error('Failed to fetch Instagram posts:', error);
        }
      }

      res.json({
        platform: 'instagram',
        connected: !!client.instagramAccessToken,
        posts,
        total: posts.length,
      });
    } catch (error) {
      console.error("Error fetching Instagram posts:", error);
      res.status(500).json({ message: "Failed to fetch Instagram posts" });
    }
  });

  // Instagram OAuth endpoints
  app.get("/api/instagram/auth", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const clientId = user?.clientId;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID required" });
      }

      const instagramClientId = process.env.INSTAGRAM_CLIENT_ID;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/instagram/callback`;

      if (!instagramClientId) {
        console.log("⚠️ Instagram OAuth not configured - missing INSTAGRAM_CLIENT_ID");
        return res.redirect('/client-analytics?error=instagram_not_configured');
      }

      const authUrl = InstagramService.getAuthUrl(
        instagramClientId,
        redirectUri,
        clientId // Use clientId as state
      );

      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating Instagram auth:", error);
      res.redirect('/client-analytics?error=instagram_auth_failed');
    }
  });

  app.get("/api/instagram/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        console.log("⚠️ Instagram callback missing code or state");
        return res.redirect('/client-analytics?error=missing_params');
      }

      const clientId = state as string;
      const instagramClientId = process.env.INSTAGRAM_CLIENT_ID;
      const instagramClientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/instagram/callback`;

      if (!instagramClientId || !instagramClientSecret) {
        console.log("⚠️ Instagram OAuth not configured - missing credentials");
        return res.redirect('/client-analytics?error=instagram_not_configured');
      }

      // Exchange code for access token
      const tokenData = await InstagramService.getAccessToken(
        instagramClientId,
        instagramClientSecret,
        code as string,
        redirectUri
      );

      // Update client with Instagram connection
      await storage.updateClient(clientId, {
        instagramAccessToken: tokenData.access_token,
        instagramUserId: tokenData.user_id,
        instagramConnectedAt: new Date(),
      });

      console.log(`✅ Instagram connected successfully for client ${clientId}`);
      // Redirect back to analytics page with success message
      res.redirect('/client-analytics?instagram=connected');
    } catch (error) {
      console.error("Error in Instagram callback:", error);
      res.redirect('/client-analytics?error=instagram_auth_failed');
    }
  });

  app.get("/api/admin/subscription-packages", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const packages = await storage.getSubscriptionPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch subscription packages" });
    }
  });

  app.post("/api/admin/subscription-packages", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const pkg = await storage.createSubscriptionPackage(req.body);
      res.status(201).json(pkg);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Failed to create subscription package" });
    }
  });

  app.patch("/api/admin/subscription-packages/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const pkg = await storage.updateSubscriptionPackage(req.params.id, req.body);
      res.json(pkg);
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "Failed to update subscription package" });
    }
  });

  app.delete("/api/admin/subscription-packages/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      await storage.deleteSubscriptionPackage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete subscription package" });
    }
  });

  // Object storage routes
  app.get("/api/upload-url", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.get("/objects/*", async (req: Request, res: Response) => {
    try {
      const objectPath = `/${req.params[0]}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      const user = req.user as any;
      const userId = user?.claims?.sub;

      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
      });

      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error(error);
      res.status(404).json({ message: "Object not found" });
    }
  });

  // ====================================
  // Second Me Routes
  // ====================================

  // Client: Get their Second Me status
  app.get("/api/second-me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(404).json({ message: "No client record found" });
      }

      const secondMeRecord = await storage.getSecondMe(userRecord.clientId);
      res.json(secondMeRecord || null);
    } catch (error) {
      console.error('Second Me fetch error:', error);
      // Return null if table doesn't exist yet (during migration)
      res.json(null);
    }
  });

  // Client: Create Second Me request (upload photos)
  app.post("/api/second-me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(400).json({ message: "No client record found" });
      }

      const { photoUrls } = req.body;

      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length < 15) {
        return res.status(400).json({ message: "Minimum 15 photos required" });
      }

      const secondMeRecord = await storage.createSecondMe({
        clientId: userRecord.clientId,
        photoUrls,
        status: "pending",
        setupPaid: false,
        weeklySubscriptionActive: false,
      });

      res.status(201).json(secondMeRecord);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create Second Me request" });
    }
  });

  // Admin: Get all Second Me requests
  app.get("/api/admin/second-me/requests", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const requests = await storage.getAllSecondMeRequests();
      
      // Join with client data to get client names
      const requestsWithClientNames = await Promise.all(
        requests.map(async (request) => {
          const client = await storage.getClient(request.clientId);
          return {
            ...request,
            clientName: client?.name || "Unknown Client",
          };
        })
      );

      res.json(requestsWithClientNames);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch Second Me requests" });
    }
  });

  // Admin: Update Second Me request (set avatar, status, etc.)
  app.patch("/api/admin/second-me/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, avatarUrl, notes, setupPaid, weeklySubscriptionActive } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (notes !== undefined) updateData.notes = notes;
      if (setupPaid !== undefined) updateData.setupPaid = setupPaid;
      if (weeklySubscriptionActive !== undefined) updateData.weeklySubscriptionActive = weeklySubscriptionActive;

      const updated = await storage.updateSecondMe(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update Second Me request" });
    }
  });

  // Admin: Upload weekly content for a Second Me avatar
  app.post("/api/admin/second-me/content", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const { secondMeId, content } = req.body;

      if (!secondMeId || !content || !Array.isArray(content)) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      // Get the Second Me record to find clientId
      const secondMeRecord = await storage.getSecondMe(secondMeId);
      if (!secondMeRecord) {
        return res.status(404).json({ message: "Second Me record not found" });
      }

      // Determine the week number (simple increment based on existing content)
      const existingContent = await storage.getSecondMeContent(secondMeId);
      const maxWeek = existingContent.reduce((max, item) => Math.max(max, item.weekNumber || 0), 0);
      const nextWeek = maxWeek + 1;

      // Create content entries
      const contentToInsert = content.map((item: any) => ({
        secondMeId,
        clientId: secondMeRecord.clientId,
        contentType: item.contentType || "image",
        mediaUrl: item.mediaUrl,
        caption: item.caption || "",
        weekNumber: nextWeek,
        status: "pending",
      }));

      const created = await storage.createBulkSecondMeContent(contentToInsert);
      res.status(201).json(created);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to upload content" });
    }
  });

  // Client: Get their Second Me content
  app.get("/api/second-me/content", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(404).json({ message: "No client record found" });
      }

      const secondMeRecord = await storage.getSecondMe(userRecord.clientId);
      if (!secondMeRecord) {
        return res.json([]);
      }

      const content = await storage.getSecondMeContent(secondMeRecord.id);
      res.json(content);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch Second Me content" });
    }
  });

  // ============================================
  // DIALPAD API ROUTES
  // ============================================

  // Test Dialpad connection
  app.get("/api/test-dialpad", async (req: Request, res: Response) => {
    try {
      if (!process.env.DIALPAD_API_KEY) {
        return res.status(503).json({ 
          success: false, 
          message: "Dialpad API is not configured. Please add DIALPAD_API_KEY to your environment variables." 
        });
      }

      // Test with a simple calls endpoint (we know this exists)
      const response = await fetch("https://dialpad.com/api/v2/calls?limit=1", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DIALPAD_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Dialpad connection failed:", response.status, errorText);
        return res.status(response.status).json({ 
          success: false, 
          message: "Dialpad connection failed", 
          error: errorText,
          status: response.status 
        });
      }

      const data = await response.json();
      console.log("✅ Connected to Dialpad! Retrieved", data.items?.length || 0, "call records");

      res.json({
        success: true,
        message: "✅ Connected to Dialpad successfully!",
        endpoint: "/api/v2/calls",
        recordsRetrieved: data.items?.length || 0,
        apiKeyValid: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("❌ Dialpad connection error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get call logs
  app.get("/api/dialpad/calls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured. Please add DIALPAD_API_KEY to your environment variables." });
      }

      const { start_time, end_time, limit, offset } = req.query;
      const callLogs = await dialpadService.getCallLogs({
        start_time: start_time as string,
        end_time: end_time as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(callLogs);
    } catch (error: any) {
      console.error('Error fetching Dialpad calls:', error);
      res.status(500).json({ message: error.message || "Failed to fetch call logs" });
    }
  });

  // Get specific call details
  app.get("/api/dialpad/calls/:callId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const callDetails = await dialpadService.getCallDetails(req.params.callId);
      res.json(callDetails);
    } catch (error: any) {
      console.error('Error fetching call details:', error);
      res.status(500).json({ message: error.message || "Failed to fetch call details" });
    }
  });

  // Make an outbound call
  app.post("/api/dialpad/calls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { to_number, from_number, from_extension_id } = req.body;
      
      if (!to_number) {
        return res.status(400).json({ message: "to_number is required" });
      }

      const result = await dialpadService.makeCall({
        to_number,
        from_number,
        from_extension_id,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error making call:', error);
      res.status(500).json({ message: error.message || "Failed to make call" });
    }
  });

  // Get SMS messages
  app.get("/api/dialpad/sms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { start_time, end_time, limit, offset } = req.query;
      const messages = await dialpadService.getSmsMessages({
        start_time: start_time as string,
        end_time: end_time as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(messages);
    } catch (error: any) {
      console.error('Error fetching SMS messages:', error);
      res.status(500).json({ message: error.message || "Failed to fetch SMS messages" });
    }
  });

  // Send SMS
  app.post("/api/dialpad/sms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { to_numbers, text, from_number } = req.body;
      
      if (!to_numbers || !Array.isArray(to_numbers) || to_numbers.length === 0) {
        return res.status(400).json({ message: "to_numbers array is required" });
      }
      
      if (!text) {
        return res.status(400).json({ message: "text message is required" });
      }

      const result = await dialpadService.sendSms({
        to_numbers,
        text,
        from_number,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Get contacts
  app.get("/api/dialpad/contacts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { limit, offset, search } = req.query;
      const contacts = await dialpadService.getContacts({
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string,
      });

      res.json(contacts);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: error.message || "Failed to fetch contacts" });
    }
  });

  // Create contact
  app.post("/api/dialpad/contacts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { name, phones, emails, company } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }

      const result = await dialpadService.createContact({
        name,
        phones,
        emails,
        company,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error creating contact:', error);
      res.status(500).json({ message: error.message || "Failed to create contact" });
    }
  });

  // Get voicemails
  app.get("/api/dialpad/voicemails", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { start_time, end_time, limit, offset } = req.query;
      const voicemails = await dialpadService.getVoicemails({
        start_time: start_time as string,
        end_time: end_time as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(voicemails);
    } catch (error: any) {
      console.error('Error fetching voicemails:', error);
      res.status(500).json({ message: error.message || "Failed to fetch voicemails" });
    }
  });

  // Get call recording
  app.get("/api/dialpad/calls/:callId/recording", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const recording = await dialpadService.getRecordingUrl(req.params.callId);
      res.json(recording);
    } catch (error: any) {
      console.error('Error fetching recording:', error);
      res.status(500).json({ message: error.message || "Failed to fetch recording" });
    }
  });

  // Get call stats
  app.get("/api/dialpad/stats/calls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { start_time, end_time, target_type, target_id } = req.query;
      
      if (!start_time || !end_time) {
        return res.status(400).json({ message: "start_time and end_time are required" });
      }

      const stats = await dialpadService.getCallStats({
        start_time: start_time as string,
        end_time: end_time as string,
        target_type: target_type as any,
        target_id: target_id as string,
      });

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching call stats:', error);
      res.status(500).json({ message: error.message || "Failed to fetch call stats" });
    }
  });

  // Get current Dialpad user info
  app.get("/api/dialpad/user/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const userInfo = await dialpadService.getCurrentUser();
      res.json(userInfo);
    } catch (error: any) {
      console.error('Error fetching Dialpad user info:', error);
      res.status(500).json({ message: error.message || "Failed to fetch user info" });
    }
  });
}
