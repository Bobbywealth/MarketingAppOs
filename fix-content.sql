-- Fix content_posts table
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS platforms JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Verify
SELECT column_name FROM information_schema.columns WHERE table_name='content_posts' ORDER BY column_name;

