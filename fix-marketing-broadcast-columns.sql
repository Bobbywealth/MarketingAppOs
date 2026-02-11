-- Migration: Add missing columns to marketing_broadcasts table for recurring broadcast support
-- This fixes the "syntax error at or near "=" error in the broadcast scheduler

-- Add is_recurring column
ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add recurring_pattern column
ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR;

-- Add recurring_interval column
ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS recurring_interval INTEGER DEFAULT 1;

-- Add recurring_end_date column
ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS recurring_end_date TIMESTAMP;

-- Add next_run_at column
ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP;

-- Create index on next_run_at for efficient scheduler queries
CREATE INDEX IF NOT EXISTS idx_marketing_broadcasts_next_run_at
ON marketing_broadcasts(next_run_at) WHERE next_run_at IS NOT NULL;

-- Create index on is_recurring for efficient filtering
CREATE INDEX IF NOT EXISTS idx_marketing_broadcasts_is_recurring
ON marketing_broadcasts(is_recurring) WHERE is_recurring = TRUE;

-- Add indexes for scheduled_at if not exists
CREATE INDEX IF NOT EXISTS idx_marketing_broadcasts_scheduled_at
ON marketing_broadcasts(scheduled_at) WHERE scheduled_at IS NOT NULL;

COMMIT;
