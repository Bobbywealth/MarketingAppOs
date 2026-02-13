import { db } from './server/db';
import { sql } from 'drizzle-orm';

/**
 * Run this script to fix the tasks table schema in production
 * npx tsx run-tasks-schema-fix.ts
 */

async function runMigration() {
  console.log('Starting tasks schema migration...');

  const migrations = [
    // Add archived_at column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN archived_at TIMESTAMP;
    RAISE NOTICE 'Added archived_at column to tasks table';
  ELSE
    RAISE NOTICE 'archived_at column already exists in tasks table';
  END IF;
END $$;`,

    // Add estimated_hours column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'estimated_hours'
  ) THEN
    ALTER TABLE tasks ADD COLUMN estimated_hours INTEGER DEFAULT 0;
    RAISE NOTICE 'Added estimated_hours column to tasks table';
  ELSE
    RAISE NOTICE 'estimated_hours column already exists in tasks table';
  END IF;
END $$;`,

    // Add tags column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tags TEXT[];
    RAISE NOTICE 'Added tags column to tasks table';
  ELSE
    RAISE NOTICE 'tags column already exists in tasks table';
  END IF;
END $$;`,

    // Add checklist column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'checklist'
  ) THEN
    ALTER TABLE tasks ADD COLUMN checklist JSONB;
    RAISE NOTICE 'Added checklist column to tasks table';
  ELSE
    RAISE NOTICE 'checklist column already exists in tasks table';
  END IF;
END $$;`,

    // Add is_recurring column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_recurring column to tasks table';
  ELSE
    RAISE NOTICE 'is_recurring column already exists in tasks table';
  END IF;
END $$;`,

    // Add recurring_pattern column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurring_pattern'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_pattern VARCHAR(50);
    RAISE NOTICE 'Added recurring_pattern column to tasks table';
  ELSE
    RAISE NOTICE 'recurring_pattern column already exists in tasks table';
  END IF;
END $$;`,

    // Add recurring_interval column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurring_interval'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_interval INTEGER DEFAULT 1;
    RAISE NOTICE 'Added recurring_interval column to tasks table';
  ELSE
    RAISE NOTICE 'recurring_interval column already exists in tasks table';
  END IF;
END $$;`,

    // Add recurring_end_date column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurring_end_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_end_date TIMESTAMP;
    RAISE NOTICE 'Added recurring_end_date column to tasks table';
  ELSE
    RAISE NOTICE 'recurring_end_date column already exists in tasks table';
  END IF;
END $$;`,

    // Add schedule_from column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'schedule_from'
  ) THEN
    ALTER TABLE tasks ADD COLUMN schedule_from VARCHAR(50) DEFAULT 'due_date';
    RAISE NOTICE 'Added schedule_from column to tasks table';
  ELSE
    RAISE NOTICE 'schedule_from column already exists in tasks table';
  END IF;
END $$;`,

    // Add space_id column
    `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN space_id VARCHAR(255);
    RAISE NOTICE 'Added space_id column to tasks table';
  ELSE
    RAISE NOTICE 'space_id column already exists in tasks table';
  END IF;
END $$;`,

    // Create task_spaces table
    `CREATE TABLE IF NOT EXISTS task_spaces (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT '#6366f1',
        icon VARCHAR(100),
        created_by INTEGER REFERENCES users(id),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Create indexes
    `CREATE INDEX IF NOT EXISTS IDX_tasks_archived_at ON tasks(archived_at) WHERE archived_at IS NOT NULL;`,
    `CREATE INDEX IF NOT EXISTS IDX_tasks_space_id ON tasks(space_id);`,
    `CREATE INDEX IF NOT EXISTS IDX_tasks_tags ON tasks USING GIN(tags) WHERE tags IS NOT NULL;`,
  ];

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`Running migration ${i + 1}/${migrations.length}...`);
    try {
      await db.execute(sql.raw(migration));
      console.log(`✓ Migration ${i + 1} completed`);
    } catch (error) {
      console.error(`✗ Migration ${i + 1} failed:`, error);
      // Continue with other migrations
    }
  }

  // Verify the schema
  console.log('\nVerifying tasks table schema...');
  const result = await db.execute(sql`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    ORDER BY ordinal_position
  `);
  
  console.log('Tasks table columns:');
  console.table(result.rows);

  console.log('\n✅ Migration completed!');
  process.exit(0);
}

runMigration().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
