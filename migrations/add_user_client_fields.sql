-- Add new fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add displayOrder to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add displayOrder to tasks table if not exists (for spaceId)
ALTER TABLE tasks ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;

-- Update activity_logs userId to integer if needed
ALTER TABLE activity_logs ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;

-- Update other tables with assignedToId to integer
ALTER TABLE clients ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;
ALTER TABLE leads ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;
ALTER TABLE tickets ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;

