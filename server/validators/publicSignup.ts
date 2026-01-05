import { z } from "zod";

const hasHttpProtocol = (s: string) => /^https?:\/\//i.test(s);

export const emailSchema = z.string().trim().toLowerCase().email("Must be a valid email");

export const websiteSchema = z.preprocess(
  (val) => {
    if (val === null || val === undefined) return undefined;
    if (typeof val !== "string") return val;
    const s = val.trim();
    if (!s) return undefined;
    
    // Add protocol if missing
    let normalized = hasHttpProtocol(s) ? s : `https://${s}`;
    
    // Simple basic check instead of strict z.string().url() which can be too aggressive
    try {
      new URL(normalized);
      return normalized;
    } catch {
      // If URL constructor fails, return as is and let the string validator catch it or just allow it if it looks like a domain
      return normalized;
    }
  },
  z.string().min(3, "Must be a valid URL").optional()
);

export const requiredWebsiteSchema = websiteSchema.refine(
  (v): v is string => typeof v === "string" && v.length > 0,
  "Website is required"
);

export const earlyLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailSchema,
  phone: z.string().trim().min(1, "Phone number is required"),
  company: z.string().trim().min(1, "Company name is required"),
  website: websiteSchema,
  industry: z.string().trim().optional(),
});

export const signupSimpleSchema = z.object({
  company: z.string().trim().min(1, "Company name is required"),
  website: websiteSchema,
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),

  name: z.string().trim().min(1, "Your name is required"),
  email: emailSchema,
  phone: z.string().trim().min(1, "Phone number is required"),

  username: z.string().trim().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().trim().min(8, "Password must be at least 8 characters").optional(),

  services: z.array(z.string().trim().min(1)).min(1, "Please select at least one service"),
  selectedPlatforms: z.array(z.string().trim().min(1)).optional(),
  budget: z.string().trim().optional(),

  webDevType: z.string().trim().optional(),
  webDevFeatures: z.array(z.string().trim().min(1)).optional(),
  webDevTimeline: z.string().trim().optional(),
  webDevBudget: z.string().trim().optional(),

  appPlatforms: z.array(z.string().trim().min(1)).optional(),
  appType: z.string().trim().optional(),
  appFeatures: z.array(z.string().trim().min(1)).optional(),
  appTimeline: z.string().trim().optional(),
  appBudget: z.string().trim().optional(),
  
  socialCredentials: z.record(z.object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().trim().min(1, "Password is required"),
  })).optional(),
  
  brandAssets: z.object({
    primaryColor: z.string().trim().optional(),
    secondaryColor: z.string().trim().optional(),
    logoUrl: z.string().trim().optional(),
    brandVoice: z.string().trim().optional(),
  }).optional(),

  notes: z.string().trim().optional(),
});

export const signupAuditSchema = z.object({
  company: z.string().trim().min(1, "Company name is required"),
  website: websiteSchema,
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),

  name: z.string().trim().min(1, "Your name is required"),
  email: emailSchema,
  phone: z.string().trim().min(1, "Phone number is required"),

  services: z.array(z.string().trim().min(1)).default([]),
  budget: z.string().trim().optional(),

  socialPlatforms: z.array(z.string().trim().min(1)).optional(),
  instagramUrl: z.string().trim().optional(),
  facebookUrl: z.string().trim().optional(),
  tiktokUrl: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  twitterUrl: z.string().trim().optional(),
  youtubeUrl: z.string().trim().optional(),

  notes: z.string().trim().optional(),
});


