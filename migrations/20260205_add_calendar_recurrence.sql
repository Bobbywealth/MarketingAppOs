-- Add recurrence support for calendar events
-- This migration adds columns to support recurring calendar events
-- with daily, weekly, and monthly patterns

-- Add recurrence columns to calendar_events table
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(20) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS recurrence_days_of_week INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for filtering recurring events
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurring ON calendar_events(is_recurring, recurrence_end_date);

-- Add comment to document the new columns
COMMENT ON COLUMN calendar_events.is_recurring IS 'Whether this event is part of a recurring series';
COMMENT ON COLUMN calendar_events.recurrence_pattern IS 'Pattern of recurrence: daily, weekly, monthly, yearly';
COMMENT ON COLUMN calendar_events.recurrence_days_of_week IS 'Days of week for weekly recurrence (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)';
COMMENT ON COLUMN calendar_events.recurrence_day_of_month IS 'Day of month for monthly recurrence (1-31)';
COMMENT ON COLUMN calendar_events.recurrence_interval IS 'Interval between occurrences (e.g., every 2 weeks)';
COMMENT ON COLUMN calendar_events.recurrence_end_date IS 'Optional end date for the recurring series';
