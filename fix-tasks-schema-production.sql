-- Fix Tasks Schema for Production
-- This migration adds all missing columns to the tasks table
-- Run this on production to fix the 500 errors on /api/tasks

-- 1. Add archived_at column if missing
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

-- 2. Add estimated_hours column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'estimated_hours'
  ) THEN
    ALTER TABLE tasks ADD COLUMN estimated_hours INTEGER DEFAULT 0;
    RAISE NOTICE 'Added estimated_hours column to tasks table';
  ELSE
    RAISE NOTICE 'estimated_hours column already exists in tasks table';
  END IF;
END $$;

-- 3. Add tags column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tags TEXT[];
    RAISE NOTICE 'Added tags column to tasks table';
  ELSE
    RAISE NOTICE 'tags column already exists in tasks table';
  END IF;
END $$;

-- 4. Add checklist column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'checklist'
  ) THEN
    ALTER TABLE tasks ADD COLUMN checklist JSONB;
    RAISE NOTICE 'Added checklist column to tasks table';
  ELSE
    RAISE NOTICE 'checklist column already exists in tasks table';
  END IF;
END $$;

-- 5. Add recurring task columns if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_recurring column to tasks table';
  ELSE
    RAISE NOTICE 'is_recurring column already exists in tasks table';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurring_pattern'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_pattern VARCHAR(50);
    RAISE NOTICE 'Added recurring_pattern column to tasks table';
  ELSE
    RAISE NOTICE 'recurring_pattern column already exists in tasks table';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurring_interval'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_interval INTEGER DEFAULT 1;
    RAISE NOTICE 'Added recurring_interval column to tasks table';
  ELSE
    RAISE NOTICE 'recurring_interval column already exists in tasks table';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurring_end_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_end_date TIMESTAMP;
    RAISE NOTICE 'Added recurring_end_date column to tasks table';
  ELSE
    RAISE NOTICE 'recurring_end_date column already exists in tasks table';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'schedule_from'
  ) THEN
    ALTER TABLE tasks ADD COLUMN schedule_from VARCHAR(50) DEFAULT 'due_date';
    RAISE NOTICE 'Added schedule_from column to tasks table';
  ELSE
    RAISE NOTICE 'schedule_from column already exists in tasks table';
  END IF;
END $$;

-- 6. Add space_id column if missing (for task spaces)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN space_id VARCHAR(255);
    RAISE NOTICE 'Added space_id column to tasks table';
  ELSE
    RAISE NOTICE 'space_id column already exists in tasks table';
  END IF;
END $$;

-- 7. Create task_spaces table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_spaces (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT '#6366f1',
    icon VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS IDX_tasks_archived_at ON tasks(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS IDX_tasks_space_id ON tasks(space_id);
CREATE INDEX IF NOT EXISTS IDX_tasks_tags ON tasks USING GIN(tags) WHERE tags IS NOT NULL;

-- 9. Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;
