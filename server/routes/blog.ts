import { Router, Request, Response } from "express";
import { db } from "../db";
import { blogPosts, insertBlogPostSchema } from "@shared/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requirePermission } from "../rbac";
import { z } from "zod";

const router = Router();

function slugify(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeTags(tags: unknown): string[] | null | undefined {
  if (tags == null) return tags as null | undefined;
  if (Array.isArray(tags)) {
    const cleaned = tags
      .map((t) => String(t).trim())
      .filter(Boolean);
    return cleaned.length ? cleaned : [];
  }
  if (typeof tags === "string") {
    const cleaned = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return cleaned.length ? cleaned : [];
  }
  return [];
}

async function ensureUniqueSlug(desired: string, excludeId?: string) {
  const base = slugify(desired) || "post";
  let candidate = base;
  let n = 2;

  // Try base, then base-2, base-3, ...
  // (Small loop, blog volume is low; avoids DB-specific upsert tricks.)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = excludeId
      ? and(eq(blogPosts.slug, candidate), ne(blogPosts.id, excludeId))
      : eq(blogPosts.slug, candidate);
    const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(where).limit(1);
    if (!existing.length) return candidate;
    candidate = `${base}-${n++}`;
  }
}

// ===== Public endpoints (no auth) =====

// List published blog posts for the public /blog page
router.get("/blog-posts", async (_req: Request, res: Response) => {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));

    return res.json(posts);
  } catch (error) {
    console.error("GET /api/blog-posts error:", error);
    return res.status(500).json({ message: "Failed to fetch blog posts" });
  }
});

// Fetch one published blog post by slug
router.get("/blog-posts/:slug", async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || "");
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
      .limit(1);

    if (!post) return res.status(404).json({ message: "Not found" });
    return res.json(post);
  } catch (error) {
    console.error("GET /api/blog-posts/:slug error:", error);
    return res.status(500).json({ message: "Failed to fetch blog post" });
  }
});

// ===== Admin endpoints (auth) =====

router.get(
  "/admin/blog-posts",
  isAuthenticated,
  requirePermission("canManageContent"),
  async (_req: Request, res: Response) => {
    try {
      const posts = await db
        .select()
        .from(blogPosts)
        .orderBy(desc(blogPosts.updatedAt), desc(blogPosts.createdAt));
      return res.json(posts);
    } catch (error) {
      console.error("GET /api/admin/blog-posts error:", error);
      return res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  }
);

router.post(
  "/admin/blog-posts",
  isAuthenticated,
  requirePermission("canManageContent"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const title = String(body.title || "");
      const desiredSlug = String(body.slug || slugify(title));
      const slug = await ensureUniqueSlug(desiredSlug);

      const validated = insertBlogPostSchema.parse({
        ...body,
        slug,
        tags: normalizeTags(body.tags),
        publishedAt: body.publishedAt ?? null,
      });

      const shouldAutoPublishAt =
        validated.status === "published" && (validated.publishedAt == null || Number.isNaN((validated.publishedAt as any)?.getTime?.()));

      const [created] = await db
        .insert(blogPosts)
        .values({
          ...validated,
          publishedAt: shouldAutoPublishAt ? new Date() : validated.publishedAt,
        })
        .returning();

      return res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payload", issues: error.issues });
      }
      console.error("POST /api/admin/blog-posts error:", error);
      return res.status(500).json({ message: "Failed to create blog post" });
    }
  }
);

const updateBlogPostSchema = insertBlogPostSchema.partial();

router.patch(
  "/admin/blog-posts/:id",
  isAuthenticated,
  requirePermission("canManageContent"),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || "");
      const body = req.body ?? {};

      const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (!existing) return res.status(404).json({ message: "Not found" });

      const desiredSlug =
        body.slug != null
          ? String(body.slug || "")
          : body.title != null
            ? slugify(String(body.title || ""))
            : existing.slug;

      const slug = desiredSlug ? await ensureUniqueSlug(desiredSlug, id) : existing.slug;

      const validated = updateBlogPostSchema.parse({
        ...body,
        ...(body.slug != null || body.title != null ? { slug } : {}),
        ...(body.tags !== undefined ? { tags: normalizeTags(body.tags) } : {}),
      });

      const nextStatus = (validated as any).status ?? existing.status;
      const nextPublishedAt =
        (validated as any).publishedAt !== undefined ? (validated as any).publishedAt : existing.publishedAt;

      const shouldAutoPublishAt = nextStatus === "published" && nextPublishedAt == null;

      const [updated] = await db
        .update(blogPosts)
        .set({
          ...validated,
          slug: (validated as any).slug ?? existing.slug,
          publishedAt: shouldAutoPublishAt ? new Date() : nextPublishedAt,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, id))
        .returning();

      return res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payload", issues: error.issues });
      }
      console.error("PATCH /api/admin/blog-posts/:id error:", error);
      return res.status(500).json({ message: "Failed to update blog post" });
    }
  }
);

router.delete(
  "/admin/blog-posts/:id",
  isAuthenticated,
  requirePermission("canManageContent"),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || "");
      const [deleted] = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning({ id: blogPosts.id });
      if (!deleted) return res.status(404).json({ message: "Not found" });
      return res.json({ ok: true });
    } catch (error) {
      console.error("DELETE /api/admin/blog-posts/:id error:", error);
      return res.status(500).json({ message: "Failed to delete blog post" });
    }
  }
);

export default router;

