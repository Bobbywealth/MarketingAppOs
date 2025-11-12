-- Create client_social_stats table for manual social media statistics entry
CREATE TABLE IF NOT EXISTS client_social_stats (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL,
  followers INTEGER,
  posts INTEGER,
  engagement DECIMAL(5,2),
  reach INTEGER,
  views INTEGER,
  growth_rate DECIMAL(5,2),
  last_updated TIMESTAMP DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, platform)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_social_stats_client_id ON client_social_stats(client_id);
CREATE INDEX IF NOT EXISTS idx_client_social_stats_platform ON client_social_stats(platform);

-- Add some sample data for carson (if exists)
INSERT INTO client_social_stats (client_id, platform, followers, posts, engagement, reach, views, growth_rate, notes)
SELECT 
  id, 
  'facebook', 
  8932, 
  23, 
  3.2, 
  28500, 
  NULL, 
  8.0,
  'Sample data from dashboard'
FROM clients 
WHERE name = 'Carson Leuders'
ON CONFLICT (client_id, platform) DO NOTHING;

INSERT INTO client_social_stats (client_id, platform, followers, posts, engagement, reach, views, growth_rate, notes)
SELECT 
  id, 
  'tiktok', 
  23567, 
  NULL, 
  6.5, 
  NULL, 
  125000, 
  23.0,
  'Sample data from dashboard'
FROM clients 
WHERE name = 'Carson Leuders'
ON CONFLICT (client_id, platform) DO NOTHING;

SELECT 'Client Social Stats table created successfully!' as status;

