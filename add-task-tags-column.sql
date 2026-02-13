-- Migration: Add tags column to tasks table
-- Run this migration to add the tags field for flexible categorization

-- Add tags column as text array
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create a GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS IDX_tasks_tags ON tasks USING GIN (tags);

-- Comment on the column
COMMENT ON COLUMN tasks.tags IS 'Array of tag strings for flexible task categorization';
