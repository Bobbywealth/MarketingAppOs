-- Create SMS messages table for Dialpad webhook integration
CREATE TABLE IF NOT EXISTS sms_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  dialpad_id VARCHAR UNIQUE,
  direction VARCHAR NOT NULL,
  from_number VARCHAR NOT NULL,
  to_number VARCHAR NOT NULL,
  text TEXT NOT NULL,
  status VARCHAR,
  user_id INTEGER REFERENCES users(id),
  lead_id INTEGER REFERENCES leads(id),
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_lead_id ON sms_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp ON sms_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_from_number ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_number ON sms_messages(to_number);

