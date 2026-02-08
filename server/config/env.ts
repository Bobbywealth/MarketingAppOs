/**
 * Environment configuration validation with Zod
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

/**
 * Database configuration
 */
const databaseSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL is required and must be a valid URL'),
});

/**
 * Session configuration
 */
const sessionSchema = z.object({
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
});

/**
 * Email/SMTP configuration
 */
const emailSchema = z.object({
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587).optional(),
  SMTP_SECURE: z.coerce.boolean().default(false).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email('SMTP_FROM_EMAIL must be a valid email if provided').optional(),
  SMTP_FROM_NAME: z.string().optional(),
  SMTP_REPLY_TO: z.string().email('SMTP_REPLY_TO must be a valid email if provided').optional(),
  SMTP_TLS_REJECT_UNAUTHORIZED: z.coerce.boolean().default(false).optional(),
});

/**
 * Twilio SMS configuration
 */
const twilioSchema = z.object({
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

/**
 * Stripe payment configuration
 */
const stripeSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with "sk_"').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'STRIPE_PUBLISHABLE_KEY must start with "pk_"').optional(),
});

/**
 * Google API configuration
 */
const googleSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
});

/**
 * OpenAI configuration
 */
const openaiSchema = z.object({
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY must start with "sk-"').optional(),
});

/**
 * Vapi AI configuration
 */
const vapiSchema = z.object({
  VAPI_API_KEY: z.string().optional(),
});

/**
 * Application configuration
 */
const appSchema = z.object({
  APP_URL: z.string().url('APP_URL must be a valid URL').default('http://localhost:5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
});

/**
 * Combined environment schema
 */
const envSchema = z.object({
  ...databaseSchema.shape,
  ...sessionSchema.shape,
  ...emailSchema.shape,
  ...twilioSchema.shape,
  ...stripeSchema.shape,
  ...googleSchema.shape,
  ...openaiSchema.shape,
  ...vapiSchema.shape,
  ...appSchema.shape,
});

/**
 * Parsed and validated environment variables
 */
export const env = envSchema.parse(process.env);

/**
 * Environment configuration object
 */
export interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // Session
  SESSION_SECRET: string;
  
  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM_EMAIL?: string;
  SMTP_FROM_NAME?: string;
  SMTP_REPLY_TO?: string;
  SMTP_TLS_REJECT_UNAUTHORIZED?: boolean;
  
  // Twilio
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  
  // Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  
  // Google
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  
  // OpenAI
  OPENAI_API_KEY?: string;
  
  // Vapi
  VAPI_API_KEY?: string;
  
  // App
  APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
}

/**
 * Check if a service is configured
 */
export function isServiceConfigured(service: 'email' | 'sms' | 'stripe' | 'google' | 'openai' | 'vapi'): boolean {
  switch (service) {
    case 'email':
      return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
    case 'sms':
      return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
    case 'stripe':
      return !!env.STRIPE_SECRET_KEY;
    case 'google':
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    case 'openai':
      return !!env.OPENAI_API_KEY;
    case 'vapi':
      return !!env.VAPI_API_KEY;
    default:
      return false;
  }
}

/**
 * Get service configuration status
 */
export function getServiceStatus() {
  return {
    database: !!env.DATABASE_URL,
    session: !!env.SESSION_SECRET,
    email: isServiceConfigured('email'),
    sms: isServiceConfigured('sms'),
    stripe: isServiceConfigured('stripe'),
    google: isServiceConfigured('google'),
    openai: isServiceConfigured('openai'),
    vapi: isServiceConfigured('vapi'),
    app: {
      url: env.APP_URL,
      env: env.NODE_ENV,
      port: env.PORT,
    },
  };
}
