/**
 * /api/content — REST endpoints for Content posts and Calendar events.
 *
 * Posts:
 *   GET    /api/content/posts              list posts (filter: clientId, status, platform, from, to)
 *   POST   /api/content/posts              create post
 *   GET    /api/content/posts/:id          get single post
 *   PATCH  /api/content/posts/:id          update post
 *   DELETE /api/content/posts/:id          delete post
 *
 * Calendar:
 *   GET    /api/content/calendar           list calendar events (filter: from, to, type)
 *   POST   /api/content/calendar           create calendar event
 *   GET    /api/content/calendar/:id       get single event
 *   PATCH  /api/content/calendar/:id       update event
 *   DELETE /api/content/calendar/:id       delete event
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { requireRole } from "../rbac";
import { UserRole } from "@shared/roles";
import {
  contentPosts,
  calendarEvents,
  insertContentPostSchema,
  insertCalendarEventSchema,
} from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { z, ZodError } from "zod";

const router = Router();

// All endpoints require authentication (session or API key).
router.use(isAuthenticated);

// ─── Utility ─────────────────────────────────────────────────────────────────

function handleError(err: unknown, res: Response) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Validation error", errors: err.errors });
  }
  const msg = err instanceof Error ? err.message : "Internal server error";
  console.error("[content api]", err);
  return res.status(500).json({ message: msg });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

/**
 * GET /api/content/posts
 * Query params: clientId, status, platform, from (ISO date), to (ISO date), limit, offset
 */
router.get("/posts", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { clientId, status, platform, from, to, limit = "100", offset = "0" } = req.query as Record<string, string>;

    // Clients may only see their own posts.
    const effectiveClientId =
      user.role === UserRole.CLIENT ? user.clientId : (clientId ?? undefined);

    let posts = effectiveClientId
      ? await storage.getContentPostsByClient(effectiveClientId)
      : await storage.getContentPosts();

    // In-memory filters for fields not indexed at storage layer.
    if (status) {
      posts = posts.filter((p) => p.approvalStatus === status);
    }
    if (platform) {
      posts = posts.filter((p) =>
        Array.isArray(p.platforms) && (p.platforms as string[]).includes(platform)
      );
    }
    if (from) {
      const fromDate = new Date(from);
      posts = posts.filter((p) => !p.scheduledFor || new Date(p.scheduledFor) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      posts = posts.filter((p) => !p.scheduledFor || new Date(p.scheduledFor) <= toDate);
    }

    const total = posts.length;
    const page = posts.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));

    return res.json({
      data: page,
      meta: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/content/posts
 */
router.post(
  "/posts",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.STAFF_CONTENT_CREATOR, UserRole.CREATOR),
  async (req: Request, res: Response) => {
    try {
      const validated = insertContentPostSchema.parse(req.body);
      const post = await storage.createContentPost(validated);
      return res.status(201).json(post);
    } catch (err) {
      return handleError(err, res);
    }
  }
);

/**
 * GET /api/content/posts/:id
 */
router.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const [post] = await db
      .select()
      .from(contentPosts)
      .where(eq(contentPosts.id, req.params.id))
      .limit(1);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = req.user as any;
    if (user.role === UserRole.CLIENT && post.clientId !== user.clientId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(post);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * PATCH /api/content/posts/:id
 */
router.patch(
  "/posts/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.STAFF_CONTENT_CREATOR, UserRole.CREATOR),
  async (req: Request, res: Response) => {
    try {
      const partial = insertContentPostSchema.partial().parse(req.body);
      const post = await storage.updateContentPost(req.params.id, partial);
      return res.json(post);
    } catch (err) {
      return handleError(err, res);
    }
  }
);

/**
 * DELETE /api/content/posts/:id
 */
router.delete(
  "/posts/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req: Request, res: Response) => {
    try {
      await storage.deleteContentPost(req.params.id);
      return res.status(204).end();
    } catch (err) {
      return handleError(err, res);
    }
  }
);

// ─── Calendar ─────────────────────────────────────────────────────────────────

/**
 * GET /api/content/calendar
 * Query params: from (ISO date), to (ISO date), type, limit, offset
 */
router.get("/calendar", async (req: Request, res: Response) => {
  try {
    const { type, from, to, limit = "200", offset = "0" } = req.query as Record<string, string>;

    let events = await storage.getCalendarEvents();

    if (type) {
      events = events.filter((e) => e.type === type);
    }
    if (from) {
      const fromDate = new Date(from);
      events = events.filter((e) => new Date(e.start) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      events = events.filter((e) => new Date(e.start) <= toDate);
    }

    const total = events.length;
    const page = events.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));

    return res.json({
      data: page,
      meta: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/content/calendar
 */
router.post(
  "/calendar",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const validated = insertCalendarEventSchema.parse({
        ...req.body,
        createdBy: req.body.createdBy ?? user.id,
      });
      const event = await storage.createCalendarEvent(validated);
      return res.status(201).json(event);
    } catch (err) {
      return handleError(err, res);
    }
  }
);

/**
 * GET /api/content/calendar/:id
 */
router.get("/calendar/:id", async (req: Request, res: Response) => {
  try {
    const event = await storage.getCalendarEvent(req.params.id);
    if (!event) return res.status(404).json({ message: "Calendar event not found" });
    return res.json(event);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * PATCH /api/content/calendar/:id
 */
router.patch(
  "/calendar/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req: Request, res: Response) => {
    try {
      const partial = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, partial);
      return res.json(event);
    } catch (err) {
      return handleError(err, res);
    }
  }
);

/**
 * DELETE /api/content/calendar/:id
 */
router.delete(
  "/calendar/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  async (req: Request, res: Response) => {
    try {
      await storage.deleteCalendarEvent(req.params.id);
      return res.status(204).end();
    } catch (err) {
      return handleError(err, res);
    }
  }
);

export default router;
