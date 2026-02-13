-- Migration: Add archivedAt column to tasks table for auto-archive functionality
-- Run this migration to add the archived_at column

-- Add archived_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN archived_at TIMESTAMP;
    RAISE NOTICE 'Added archived_at column to tasks table';
  ELSE
    RAISE NOTICE 'archived_at column already exists in tasks table';
  END IF;
END $$;

-- Create index for archived tasks queries
CREATE INDEX IF NOT EXISTS IDX_tasks_archived_at ON tasks(archived_at) WHERE archived_at IS NOT NULL;

-- Create composite index for common archive queries
CREATE INDEX IF NOT EXISTS IDX_tasks_status_archived ON tasks(status, archived_at);

-- Add comment to document the column
COMMENT ON COLUMN tasks.archived_at IS 'Timestamp when the task was archived. Used for auto-archiving old completed tasks.';
