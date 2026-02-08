-- Task Templates table for reusable task configurations
CREATE TABLE IF NOT EXISTS task_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  title VARCHAR NOT NULL,
  task_description TEXT,
  status VARCHAR NOT NULL DEFAULT 'todo',
  priority VARCHAR NOT NULL DEFAULT 'normal',
  due_date_offset INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR,
  recurring_interval INTEGER DEFAULT 1,
  checklist JSONB,
  created_by INTEGER REFERENCES users(id),
  is_system_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS IDX_task_templates_created_by ON task_templates(created_by);
CREATE INDEX IF NOT EXISTS IDX_task_templates_is_system ON task_templates(is_system_template);

-- Insert default system templates
INSERT INTO task_templates (name, description, title, task_description, status, priority, due_date_offset, is_system_template, checklist) VALUES
('Weekly Team Meeting', 'Template for recurring weekly team meetings', 'Weekly Team Meeting', 'Discuss project updates, blockers, and upcoming tasks', 'todo', 'normal', 7, true, '[{"id": "1", "text": "Review project updates", "completed": false}, {"id": "2", "text": "Identify blockers", "completed": false}, {"id": "3", "text": "Plan next week''s tasks", "completed": false}]'),
('Follow Up with Client', 'Template for client follow-up tasks', 'Follow Up with Client', 'Follow up with client regarding recent work or proposal', 'todo', 'high', 3, true, '[{"id": "1", "text": "Review recent work", "completed": false}, {"id": "2", "text": "Prepare talking points", "completed": false}, {"id": "3", "text": "Schedule meeting", "completed": false}]'),
('Content Review', 'Template for reviewing content before publishing', 'Content Review', 'Review and approve content for publication', 'todo', 'high', 2, true, '[{"id": "1", "text": "Check grammar and spelling", "completed": false}, {"id": "2", "text": "Verify brand alignment", "completed": false}, {"id": "3", "text": "Test links and media", "completed": false}, {"id": "4", "text": "Approve for publication", "completed": false}]'),
('Campaign Launch', 'Template for launching new marketing campaigns', 'Campaign Launch', 'Launch new marketing campaign across all channels', 'todo', 'urgent', 1, true, '[{"id": "1", "text": "Finalize creative assets", "completed": false}, {"id": "2", "text": "Set up tracking", "completed": false}, {"id": "3", "text": "Schedule posts", "completed": false}, {"id": "4", "text": "Launch campaign", "completed": false}, {"id": "5", "text": "Monitor initial performance", "completed": false}]'),
('Monthly Report', 'Template for monthly client reports', 'Monthly Report', 'Prepare and send monthly performance report', 'todo', 'normal', 5, true, '[{"id": "1", "text": "Gather analytics data", "completed": false}, {"id": "2", "text": "Create report", "completed": false}, {"id": "3", "text": "Review with team", "completed": false}, {"id": "4", "text": "Send to client", "completed": false}]');

-- Add checklist column to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'checklist'
  ) THEN
    ALTER TABLE tasks ADD COLUMN checklist JSONB;
  END IF;
END $$;
