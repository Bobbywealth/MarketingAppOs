-- Add social media link columns, Google Business Profile, YouTube, needs, and status to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS instagram VARCHAR,
ADD COLUMN IF NOT EXISTS tiktok VARCHAR,
ADD COLUMN IF NOT EXISTS facebook VARCHAR,
ADD COLUMN IF NOT EXISTS youtube VARCHAR,
ADD COLUMN IF NOT EXISTS google_business_profile VARCHAR,
ADD COLUMN IF NOT EXISTS rating INTEGER,
ADD COLUMN IF NOT EXISTS needs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'research_completed';

