-- Task Management Platform Enhancements
-- Migration: Add task dependencies, activity tracking, attachments, and analytics

-- 1. Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocks_completion BOOLEAN DEFAULT FALSE;

-- 2. Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    prerequisite_task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS IDX_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS IDX_task_deps_prerequisite ON task_dependencies(prerequisite_task_id);
CREATE UNIQUE INDEX IF NOT EXISTS IDX_task_deps_unique ON task_dependencies(task_id, prerequisite_task_id);

-- 3. Create task_activity table
CREATE TABLE IF NOT EXISTS task_activity (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS IDX_task_activity_task ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS IDX_task_activity_user ON task_activity(user_id);
CREATE INDEX IF NOT EXISTS IDX_task_activity_created ON task_activity(created_at);

-- 4. Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    file_name VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(200),
    object_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS IDX_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS IDX_task_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS IDX_task_attachments_created ON task_attachments(created_at);

-- 5. Create task_analytics_snapshot table
CREATE TABLE IF NOT EXISTS task_analytics_snapshot (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    overdue_tasks INTEGER DEFAULT 0,
    avg_completion_time INTEGER,
    tasks_by_status JSONB,
    tasks_by_priority JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS IDX_task_analytics_date ON task_analytics_snapshot(snapshot_date);

-- 6. Create saved_task_searches table
CREATE TABLE IF NOT EXISTS saved_task_searches (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS IDX_saved_searches_user ON saved_task_searches(user_id);
CREATE INDEX IF NOT EXISTS IDX_saved_searches_is_default ON saved_task_searches(user_id, is_default);
