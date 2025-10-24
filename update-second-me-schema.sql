-- Add character fields to second_me table
ALTER TABLE second_me 
ADD COLUMN IF NOT EXISTS character_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS vibe VARCHAR(100),
ADD COLUMN IF NOT EXISTS mission TEXT,
ADD COLUMN IF NOT EXISTS story_words VARCHAR(255),
ADD COLUMN IF NOT EXISTS topics TEXT, -- JSON array stored as text
ADD COLUMN IF NOT EXISTS personality_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS dream_collab VARCHAR(255),
ADD COLUMN IF NOT EXISTS catchphrase TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS content_style VARCHAR(100),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create second_me_content table for storing AI-generated content
CREATE TABLE IF NOT EXISTS second_me_content (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'image' or 'video'
  url TEXT NOT NULL,
  thumbnail TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_second_me_content_client_id ON second_me_content(client_id);
CREATE INDEX IF NOT EXISTS idx_second_me_content_created_at ON second_me_content(created_at DESC);

-- Sample data for testing (optional - remove if you don't want sample content)
-- This will help you see the UI with some content
-- Uncomment the lines below if you want to add sample content for testing

