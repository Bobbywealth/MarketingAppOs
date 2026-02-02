-- Migration: Add missing columns for marketing and automation features
-- Generated: 2026-02-02

-- Add channel column to marketing_broadcasts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'channel'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN channel VARCHAR(50) NOT NULL DEFAULT 'sms';
    RAISE NOTICE 'Added channel column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'channel column already exists in marketing_broadcasts';
  END IF;
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
