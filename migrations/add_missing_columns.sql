-- Migration: Add missing columns to existing tables
-- Generated: 2026-01-28

-- Add parameters column to scheduled_ai_commands if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_ai_commands' AND column_name = 'parameters'
  ) THEN
    ALTER TABLE scheduled_ai_commands ADD COLUMN parameters JSONB;
    RAISE NOTICE 'Added parameters column to scheduled_ai_commands';
  ELSE
    RAISE NOTICE 'parameters column already exists in scheduled_ai_commands';
  END IF;
END $$;

-- Add media_url column to marketing_broadcasts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN media_url VARCHAR(500);
    RAISE NOTICE 'Added media_url column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'media_url column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add media_type column to marketing_broadcasts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN media_type VARCHAR(50);
    RAISE NOTICE 'Added media_type column to marketing_broadcasts';
  ELSE
    RAISE NOTICE 'media_type column already exists in marketing_broadcasts';
  END IF;
END $$;

-- Add missing columns to marketing_broadcast_recipients if they don't exist
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
