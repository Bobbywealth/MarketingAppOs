-- Add missing payout columns to creators table
ALTER TABLE creators ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'manual';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending';

