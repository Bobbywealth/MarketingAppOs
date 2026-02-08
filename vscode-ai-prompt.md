# VS Code AI Prompt - Tasks Page 500 Error

## Problem
The tasks page (https://www.marketingteam.app/tasks) is returning 500 errors.

## Root Cause
PostgreSQL is throwing error 42703 - "column does not exist" when trying to select from the tasks table.

The schema.ts file defines these columns that don't exist in the database:
- isRecurring (is_recurring)
- taskProgress (task_progress)
- estimatedHours (estimated_hours)
- tags
- startDate (start_date)
- blocksCompletion (blocks_completion)
- recurringPattern (recurring_pattern)
- recurringInterval (recurring_interval)
- recurringEndDate (recurring_end_date)

## What's been done
1. Database migrations were run via Render shell to add these columns
2. Server was restarted multiple times
3. Build cache was cleared and redeployed

## Question
Why is Drizzle ORM still returning 500 errors even after adding the columns? The query `db.select().from(tasks)` should work if all columns exist in both the schema and database.

## Expected Fix
Make the tasks page load successfully. Either:
- Option 1: Remove the problematic columns from schema.ts so it matches the database
- Option 2: Ensure all columns exist in both schema and database

Please investigate and fix this issue!
