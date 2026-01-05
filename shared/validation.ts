import { z } from "zod";

// Re-defining schemas without Drizzle dependencies for the client bundle
// This avoids pulling in drizzle-orm/pg-core which causes initialization errors in the browser.

export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  email: z.string().email().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  role: z.string().default("staff"),
});

export const insertLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  status: z.string().default("new"),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const insertContentPostSchema = z.object({
  clientId: z.string(),
  title: z.string().min(1),
  content: z.string(),
  platforms: z.array(z.string()),
  scheduledFor: z.string().optional().nullable(),
});

export const insertWebsiteProjectSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1),
  url: z.string().url().optional().nullable(),
  stage: z.string().default("design"),
});

