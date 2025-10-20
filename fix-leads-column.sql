-- Emergency fix: Add client_id column to leads table
-- Run this directly in Render PostgreSQL dashboard if signup still fails

-- Add the column if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id VARCHAR;

-- Add the foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_client_id_fkey' 
        AND table_name = 'leads'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT leads_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id);
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'client_id';

