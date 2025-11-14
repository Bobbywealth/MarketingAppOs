-- Migration: Add Industry and Tags columns to leads table
-- Adds flexible organization with industry dropdown and custom tags

-- Step 1: Add industry column (single select)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry VARCHAR;

-- Step 2: Add tags column (JSON array for multiple tags)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Step 3: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);

-- Step 4: Add some sample data for existing leads (optional)
-- UPDATE leads SET industry = 'technology' WHERE company ILIKE '%tech%' OR company ILIKE '%software%';
-- UPDATE leads SET industry = 'finance' WHERE company ILIKE '%bank%' OR company ILIKE '%financial%';
-- UPDATE leads SET industry = 'healthcare' WHERE company ILIKE '%health%' OR company ILIKE '%medical%';

-- Verification: Check the changes
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('industry', 'tags')
ORDER BY column_name;

-- Expected results:
-- industry | character varying | YES
-- tags     | jsonb            | YES (default '[]')

-- Example of how tags work:
-- INSERT INTO leads (name, company, industry, tags, stage, score, source) 
-- VALUES ('John Doe', 'Acme Corp', 'technology', '["VIP", "High Priority", "Follow Up"]'::jsonb, 'prospect', 'warm', 'website');

-- Query leads by industry:
-- SELECT * FROM leads WHERE industry = 'technology';

-- Query leads by tag:
-- SELECT * FROM leads WHERE tags ? 'VIP';

-- Query leads with multiple tags:
-- SELECT * FROM leads WHERE tags ?| array['VIP', 'High Priority'];

