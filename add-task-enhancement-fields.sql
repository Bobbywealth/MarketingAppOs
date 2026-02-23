-- Migration: Add task enhancement fields
-- Description: Adds taskProgress, startDate, and blocksCompletion fields to tasks table
-- Date: 2024-02-23

-- Add taskProgress field (0-100 percentage)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_progress INTEGER DEFAULT 0;

-- Add startDate field for Gantt/timeline view
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;

-- Add blocksCompletion field for dependency blocking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocks_completion BOOLEAN DEFAULT FALSE;

-- Add index on start_date for timeline queries
CREATE INDEX IF NOT EXISTS IDX_tasks_start_date ON tasks(start_date);

-- Add composite index for timeline views
CREATE INDEX IF NOT EXISTS IDX_tasks_start_end_date ON tasks(start_date, due_date) WHERE start_date IS NOT NULL;

-- Add constraint to ensure taskProgress is between 0 and 100
ALTER TABLE tasks ADD CONSTRAINT CHK_task_progress_range CHECK (task_progress >= 0 AND task_progress <= 100);

-- Update taskProgress based on existing checklist data
UPDATE tasks 
SET task_progress = (
  SELECT 
    CASE 
      WHEN jsonb_array_length(checklist) = 0 THEN 0
      ELSE ROUND(
        (SELECT COUNT(*) FROM jsonb_array_elements(checklist) item WHERE item->>'completed' = 'true')::numeric / 
        jsonb_array_length(checklist) * 100
      )
    END
  WHERE checklist IS NOT NULL 
  AND jsonb_array_length(checklist) > 0
  AND task_progress = 0
);

-- Comment on new columns
COMMENT ON COLUMN tasks.task_progress IS 'Progress percentage (0-100) calculated from checklist completion';
COMMENT ON COLUMN tasks.start_date IS 'Start date for Gantt chart and timeline views';
COMMENT ON COLUMN tasks.blocks_completion IS 'Flag indicating if incomplete dependencies should block task completion';
