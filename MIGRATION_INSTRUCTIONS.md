# Database Migration Instructions

## Issue: Missing Columns in Production Database

The production database is missing the new task management columns and tables that were added in the recent code changes.

## Errors Being Fixed

1. `column "task_progress" does not exist`
2. `column "recipient_type" does not exist` (marketing series)

## Solution: Run the Migration

### Option 1: Run via Render Dashboard (Recommended)

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your MarketingAppOs service
3. Click on the "Database" tab
4. You should see your PostgreSQL database
5. Click "Open SQL Editor"
6. Copy and paste the contents of [`run-task-migration.sql`](run-task-migration.sql)
7. Click "Run SQL" or press Enter

### Option 2: Run via psql (If you have database access)

```bash
# If you have DATABASE_URL in your environment
psql $DATABASE_URL -f run-task-migration.sql

# Or if you know the connection details
psql postgres://user:password@host:port/database_name -f run-task-migration.sql
```

### Option 3: Run via Drizzle Kit (If database is available locally)

```bash
npx drizzle-kit push
```

## What the Migration Does

The migration adds:

### To the `tasks` table:
- `task_progress` (INTEGER, default 0)
- `estimated_hours` (INTEGER)
- `tags` (TEXT[])
- `start_date` (TIMESTAMP)
- `blocks_completion` (BOOLEAN, default FALSE)

### New Tables:
1. `task_dependencies` - For task prerequisite relationships
2. `task_activity` - For activity tracking
3. `task_attachments` - For file attachments
4. `task_analytics_snapshot` - For analytics data
5. `saved_task_searches` - For saved search filters

### Indexes:
- All tables have proper indexes for performance
- Unique constraints on task dependencies

## After Running the Migration

1. Wait 30-60 seconds for the database to apply changes
2. Refresh your application at https://www.marketingteam.app
3. Navigate to the Tasks page
4. The `/api/tasks` endpoint should now work without errors

## Troubleshooting

### If the migration fails:
- Check if the columns already exist (they might have been added by Drizzle's `ensureSchema`)
- Check database permissions
- Review the error message for specific issues

### If the migration succeeds but errors persist:
- Restart your Render service
- Clear browser cache
- Check the logs in the Render dashboard

## Verification

After running the migration, you can verify it worked by:

1. Checking the database schema in Render SQL Editor
2. Navigating to https://www.marketingteam.app/tasks
3. Checking browser console for errors
4. Looking at server logs in Render dashboard

## Additional Notes

- The migration uses `IF NOT EXISTS` and `IF EXISTS` clauses, so it's safe to run multiple times
- All changes are backwards compatible
- Existing data will not be affected
- The migration will take 10-30 seconds to complete depending on database size
