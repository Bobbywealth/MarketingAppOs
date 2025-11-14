-- Migration: Create SMS Messages Table
-- This table stores SMS messages sent/received via Dialpad

CREATE TABLE IF NOT EXISTS sms_messages (
  id SERIAL PRIMARY KEY,
  dialpad_id VARCHAR UNIQUE,
  direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR NOT NULL,
  to_number VARCHAR NOT NULL,
  text TEXT NOT NULL,
  status VARCHAR,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lead_id VARCHAR REFERENCES leads(id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_lead_id ON sms_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction);
CREATE INDEX IF NOT EXISTS idx_sms_messages_from_number ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_number ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp ON sms_messages(timestamp);

-- Verification: Check the table was created
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sms_messages'
ORDER BY ordinal_position;

-- Expected columns:
-- id, dialpad_id, direction, from_number, to_number, text, status, 
-- user_id, lead_id, timestamp, created_at, updated_at

-- Sample query to test:
-- SELECT * FROM sms_messages WHERE user_id = 3 ORDER BY timestamp DESC LIMIT 10;

