-- Fix missing columns after rollback

-- Check if we need to add type column to campaigns (if it's missing)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type VARCHAR;

-- Remove any new columns that shouldn't be there after rollback
ALTER TABLE users DROP COLUMN IF EXISTS client_id;
ALTER TABLE onboarding_tasks DROP COLUMN IF EXISTS assigned_to_id;
ALTER TABLE onboarding_tasks DROP COLUMN IF EXISTS category;

-- Ensure all expected columns exist
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS spent INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;

