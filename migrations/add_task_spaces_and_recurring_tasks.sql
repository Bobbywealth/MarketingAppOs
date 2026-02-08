-- Migration: Add task_spaces table and recurring task columns
-- Created: Feb 8, 2026

-- Create task_spaces table for organizing tasks into groups/projects
CREATE TABLE IF NOT EXISTS task_spaces (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT '#3B82F6',
  icon VARCHAR(100) DEFAULT 'folder',
  created_by INTEGER REFERENCES users(id),
  parent_space_id VARCHAR(255) REFERENCES task_spaces(id),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS space_id VARCHAR(255) REFERENCES task_spaces(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_interval INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_end_date TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS schedule_from VARCHAR(50) DEFAULT 'due_date';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_space_id ON tasks(space_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_spaces_created_by ON task_spaces(created_by);
