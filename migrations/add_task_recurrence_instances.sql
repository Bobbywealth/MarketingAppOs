-- Robust recurrence instance tracking for tasks (prevents duplicate next-occurrence creation)
ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS recurrence_series_id VARCHAR;
ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS recurrence_instance_date VARCHAR(10);

-- One instance per series per (America/New_York) calendar day
CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_recurrence_series_instance
  ON tasks(recurrence_series_id, recurrence_instance_date);

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_series_id
  ON tasks(recurrence_series_id);


