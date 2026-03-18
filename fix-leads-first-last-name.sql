-- Add first_name and last_name columns to leads table if they don't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('first_name', 'last_name');
