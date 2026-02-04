-- Migration: Add missing columns for marketing and automation features
-- Updated: 2026-02-04

-- Add type column to marketing_broadcasts if missing (replaces channel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'type'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'sms';
    RAISE NOTICE 'Added type column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'type column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add audience column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'audience'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN audience VARCHAR(50) NOT NULL DEFAULT 'all';
    RAISE NOTICE 'Added audience column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'audience column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add group_id column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN group_id VARCHAR(255);
    RAISE NOTICE 'Added group_id column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'group_id column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add custom_recipient column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'custom_recipient'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN custom_recipient VARCHAR(255);
    RAISE NOTICE 'Added custom_recipient column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'custom_recipient column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add subject column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'subject'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN subject VARCHAR(500);
    RAISE NOTICE 'Added subject column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'subject column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add filters column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'filters'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN filters JSONB;
    RAISE NOTICE 'Added filters column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'filters column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add media_urls column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN media_urls JSONB;
    RAISE NOTICE 'Added media_urls column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'media_urls column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add completed_at column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN completed_at TIMESTAMP;
    RAISE NOTICE 'Added completed_at column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'completed_at column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add total_recipients column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'total_recipients'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN total_recipients INTEGER DEFAULT 0;
    RAISE NOTICE 'Added total_recipients column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'total_recipients column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add success_count column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'success_count'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN success_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added success_count column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'success_count column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add failed_count column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'failed_count'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN failed_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added failed_count column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'failed_count column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add recurring_interval column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'recurring_interval'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN recurring_interval INTEGER DEFAULT 1;
    RAISE NOTICE 'Added recurring_interval column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'recurring_interval column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add parent_broadcast_id column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'parent_broadcast_id'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN parent_broadcast_id VARCHAR(255);
    RAISE NOTICE 'Added parent_broadcast_id column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'parent_broadcast_id column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add use_ai_personalization column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'use_ai_personalization'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN use_ai_personalization BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added use_ai_personalization column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'use_ai_personalization column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add custom_recipient column to marketing_broadcast_recipients if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcast_recipients' AND column_name = 'custom_recipient'
  ) THEN
    ALTER TABLE marketing_broadcast_recipients ADD COLUMN custom_recipient VARCHAR(255);
    RAISE NOTICE 'Added custom_recipient column to marketing_broadcast_recipients';
  ELSE
    RAISE NOTICE 'custom_recipient column already exists in marketing_broadcast_recipients';
  END IF;
END $$;

-- Add provider_call_id column to marketing_broadcast_recipients if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcast_recipients' AND column_name = 'provider_call_id'
  ) THEN
    ALTER TABLE marketing_broadcast_recipients ADD COLUMN provider_call_id VARCHAR(255);
    RAISE NOTICE 'Added provider_call_id column to marketing_broadcast_recipients';
  ELSE
    RAISE NOTICE 'provider_call_id column already exists in marketing_broadcast_recipients';
  END IF;
END $$;

-- Make recipient_id nullable in marketing_broadcast_recipients
DO $$
BEGIN
  ALTER TABLE marketing_broadcast_recipients ALTER COLUMN recipient_id DROP NOT NULL;
  RAISE NOTICE 'Made recipient_id nullable in marketing_broadcast_recipients';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'recipient_id may already be nullable or column does not exist';
END $$;

-- Make recipient_type nullable in marketing_broadcast_recipients
DO $$
BEGIN
  ALTER TABLE marketing_broadcast_recipients ALTER COLUMN recipient_type DROP NOT NULL;
  RAISE NOTICE 'Made recipient_type nullable in marketing_broadcast_recipients';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'recipient_type may already be nullable or column does not exist';
END $$;

-- Add is_active column to lead_automations if missing (for getDueLeadAutomations query)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_automations' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE lead_automations ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Added is_active column to lead_automations';
  ELSE
    RAISE NOTICE 'is_active column already exists in lead_automations';
  END IF;
END $$;

-- Add next_run_at column to lead_automations if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_automations' AND column_name = 'next_run_at'
  ) THEN
    ALTER TABLE lead_automations ADD COLUMN next_run_at TIMESTAMP;
    RAISE NOTICE 'Added next_run_at column to lead_automations';
  ELSE
    RAISE NOTICE 'next_run_at column already exists in lead_automations';
  END IF;
END $$;

-- Ensure recipient_id column exists in marketing_series_enrollments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_series_enrollments' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE marketing_series_enrollments ADD COLUMN recipient_id VARCHAR(255) NOT NULL DEFAULT 'unknown';
    RAISE NOTICE 'Added recipient_id column to marketing_series_enrollments';
  ELSE
    RAISE NOTICE 'recipient_id column already exists in marketing_series_enrollments';
  END IF;
END $$;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_lead_automations_is_active ON lead_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_automations_next_run_at ON lead_automations(next_run_at);
CREATE INDEX IF NOT EXISTS idx_marketing_broadcasts_type ON marketing_broadcasts(type);
CREATE INDEX IF NOT EXISTS idx_marketing_broadcasts_status ON marketing_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_marketing_broadcast_recipients_provider_call_id ON marketing_broadcast_recipients(provider_call_id);
