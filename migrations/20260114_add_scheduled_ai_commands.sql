-- Scheduled AI commands for AI Business Manager
CREATE TABLE IF NOT EXISTS scheduled_ai_commands (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  command TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP NOT NULL,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR,
  recurring_interval INTEGER DEFAULT 1,
  recurring_end_date TIMESTAMP,
  last_response TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_user_id
  ON scheduled_ai_commands(user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_status
  ON scheduled_ai_commands(status);

CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_next_run_at
  ON scheduled_ai_commands(next_run_at);
