ALTER TABLE users
  ADD COLUMN IF NOT EXISTS custom_permissions JSONB;

CREATE TABLE IF NOT EXISTS group_conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_conversation_members (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR NOT NULL REFERENCES group_conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL REFERENCES group_conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url VARCHAR,
  media_type TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

