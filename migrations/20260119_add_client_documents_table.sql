-- Migration: Add client_documents table for client document management
-- Date: 2026-01-19

-- Create client_documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  object_path VARCHAR NOT NULL, -- Path to object in storage
  file_type VARCHAR, -- pdf, doc, image, etc
  file_size INTEGER, -- in bytes
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS IDX_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS IDX_client_documents_type ON client_documents(file_type);
CREATE INDEX IF NOT EXISTS IDX_client_documents_created ON client_documents(created_at);