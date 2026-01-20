import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { campaigns, tasks, contentPosts, creatorVisits, onboardingTasks } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requirePermission, rolePermissions } from "../rbac";
import { UserRole } from "@shared/roles";
import { 
  getCurrentUserContext 
} from "./utils";
import { 
  handleValidationError, 
  notifyAdminsAboutAction 
} from "./common";
import { insertCampaignSchema, insertTaskSchema, insertContentPostSchema } from "@shared/schema";
import { z, ZodError } from "zod";

const router = Router();

// Campaign routes
router.get("/campaigns", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const campaignsList = await storage.getCampaigns(user);
    res.json(campaignsList);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

router.post("/campaigns", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as any;
    const validatedData = insertCampaignSchema.parse(req.body);
    const campaign = await storage.createCampaign({
      ...validatedData,
      createdBy: currentUser?.id,
    });
    
    const actorName = currentUser?.firstName || currentUser?.username || 'A team member';
    if (currentUser?.role !== 'admin') {
      await notifyAdminsAboutAction(
        currentUser?.id,
        actorName,
        '📣 New Campaign Created',
        `${actorName} created campaign: ${campaign.name}`,
        'campaign',
        `/campaigns?campaignId=${campaign.id}`,
        'success'
      );
    }
    
    res.status(201).json(campaign);
  } catch (error) {
    handleValidationError(error, res);
  }
});

// Content Post routes
router.get("/content-posts", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userRole = user?.role || 'staff';
    const clientId = user?.clientId;
    
    if (userRole === 'client' && clientId) {
      const posts = await storage.getContentPostsByClient(clientId);
      return res.json(posts);
    }
    
    if (!user || !rolePermissions[userRole as UserRole]?.canManageContent) {
      return res.status(403).json({ message: "Permission denied" });
    }
    
    const posts = await storage.getContentPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch content posts" });
  }
});

router.post("/content-posts", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (user.role === 'client') {
      const validatedData = insertContentPostSchema.parse({
        ...req.body,
        clientId: String(user.clientId || user.id),
        approvalStatus: 'pending',
      });
      const post = await storage.createContentPost(validatedData);
      return res.status(201).json(post);
    }
    
    const validatedData = insertContentPostSchema.parse(req.body);
    const post = await storage.createContentPost(validatedData);
    res.status(201).json(post);
  } catch (error) {
    handleValidationError(error, res);
  }
});

export default router;
