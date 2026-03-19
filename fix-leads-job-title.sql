-- Add missing job_title column to leads table
-- This fixes the error: column "job_title" does not exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title varchar(255);
