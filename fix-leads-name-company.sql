-- Migration: Make company required and name optional in leads table
-- This changes the validation so company is mandatory instead of person's name

-- Step 1: Make name nullable (allow empty names)
ALTER TABLE leads ALTER COLUMN name DROP NOT NULL;

-- Step 2: Make company required (NOT NULL)
-- First, update any existing leads with null company to have a default value
UPDATE leads SET company = 'Not Provided' WHERE company IS NULL OR company = '';

-- Then add the NOT NULL constraint
ALTER TABLE leads ALTER COLUMN company SET NOT NULL;

-- Verification: Check the changes
SELECT 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('name', 'company')
ORDER BY column_name;

-- Expected results:
-- company | NO  | character varying  (NOT NULL)
-- name    | YES | character varying  (Nullable)

