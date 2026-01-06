-- Migration: Add requires_brand_info column to clients table
-- Description: Add missing requires_brand_info column to support brand requirement tracking

-- Add the column if it doesn't exist
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS requires_brand_info BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN clients.requires_brand_info IS 'Indicates whether this client requires brand information to be provided';

-- Optional index (only helpful if this column is frequently filtered on)
CREATE INDEX IF NOT EXISTS idx_clients_requires_brand_info ON clients(requires_brand_info);


