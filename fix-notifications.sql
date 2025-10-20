-- Fix database schema issues
-- Add missing columns with defaults and rename columns

-- 1. Fix notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR NOT NULL DEFAULT 'general';

-- Rename link to action_url if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='link') THEN
    ALTER TABLE notifications RENAME COLUMN link TO action_url;
  END IF;
END $$;

-- 2. Fix invoices table - rename paid_date to paid_at
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_name='invoices' AND column_name='paid_date') THEN
    ALTER TABLE invoices RENAME COLUMN paid_date TO paid_at;
  END IF;
END $$;

-- Verify the changes
SELECT 'notifications' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications'
UNION ALL
SELECT 'invoices' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name LIKE '%paid%'
ORDER BY table_name, column_name;

