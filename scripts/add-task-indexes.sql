-- Task Performance Indexes
-- Run this script to add indexes for better task query performance

-- Index on status for filtering by status (kanban columns)
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Index on assigned user for filtering by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks("assignedToId");

-- Index on due date for sorting and filtering by due date
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks("dueDate");

-- Index on space for filtering by task space
CREATE INDEX IF NOT EXISTS idx_tasks_space_id ON tasks("spaceId");

-- Index on client for filtering by client
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks("clientId");

-- Index on priority for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Composite index for common queries (status + assigned_to)
CREATE INDEX IF NOT EXISTS idx_tasks_status_assignee ON tasks(status, "assignedToId");

-- Composite index for due date queries (status + due_date)
CREATE INDEX IF NOT EXISTS idx_tasks_status_duedate ON tasks(status, "dueDate");

-- Index on created_at for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks("createdAt");

-- Index on recurring tasks for background job processing
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks("isRecurring") WHERE "isRecurring" = true;

-- Index for archived tasks
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived) WHERE archived = true;

-- Task comments index for faster comment retrieval
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments("taskId");

-- Task dependencies indexes
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies("taskId");
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies("dependsOnTaskId");

-- Task attachments index
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments("taskId");

-- Task activity log index
CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity("taskId");
CREATE INDEX IF NOT EXISTS idx_task_activity_created_at ON task_activity("createdAt");

-- Task spaces indexes
CREATE INDEX IF NOT EXISTS idx_task_spaces_parent ON task_spaces("parentSpaceId");
CREATE INDEX IF NOT EXISTS idx_task_spaces_order ON task_spaces("order");

-- Analyze tables after creating indexes
ANALYZE tasks;
ANALYZE task_comments;
ANALYZE task_dependencies;
ANALYZE task_attachments;
ANALYZE task_activity;
ANALYZE task_spaces;
