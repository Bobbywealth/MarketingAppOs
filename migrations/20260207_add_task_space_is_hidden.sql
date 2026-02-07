ALTER TABLE task_spaces
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

UPDATE task_spaces
SET is_hidden = false
WHERE is_hidden IS NULL;
