# Task Management Platform Enhancement Plan

## Executive Summary

This document outlines a comprehensive enhancement plan for the MarketingAppOs task management platform. The current implementation provides solid foundational features including task CRUD, task spaces, comments, templates, and recurring tasks. This plan adds advanced features including task dependencies, drag-and-drop Kanban board, enhanced prioritization, subtask progress tracking, team workload indicators, advanced filtering, activity history, deadline reminders, task analytics, and file attachments.

## Current Implementation Analysis

### Existing Features
- **Tasks Table**: Basic task management with title, description, status, priority, due date, checklist (JSON)
- **Task Spaces**: Organizational grouping for tasks
- **Task Comments**: Collaboration through comments
- **Task Templates**: Reusable task configurations
- **Recurring Tasks**: Basic recurrence with pattern support
- **Notifications**: Email, push, and in-app notifications for task updates

### Identified Gaps
| Feature | Current State | Required Enhancement |
|---------|---------------|---------------------|
| Task Dependencies | Not implemented | New `task_dependencies` table with prerequisite relationships |
| Kanban Board | Basic list/board toggle | Full drag-and-drop with customizable columns |
| Priority Indicators | Simple enum values | Color-coded visual indicators |
| Subtask Progress | JSON checklist only | Progress bar with completion percentage |
| Workload Indicators | Assignment only | Real-time workload metrics per user |
| Advanced Filtering | Basic filters | Multi-criteria search with save capability |
| Activity History | Comments only | Full audit trail of all changes |
| File Attachments | Not implemented | Upload, preview, and management |
| Task Analytics | Not implemented | Completion rates, bottlenecks, productivity |

---

## Phase 1: Foundation & Data Model

### 1.1 Database Schema Enhancements

#### New Tables

```typescript
// task_dependencies.ts - Task prerequisite relationships
export const taskDependencies = pgTable("task_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),      // The dependent task
  prerequisiteTaskId: varchar("prerequisite_task_id").references(() => tasks.id).notNull(), // Must complete first
  dependencyType: varchar("dependency_type").default("finish_to_start"), // finish_to_start, start_to_start
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_task_deps_task").on(table.taskId),
  index("IDX_task_deps_prerequisite").on(table.prerequisiteTaskId),
  // Prevent duplicate dependencies
  index("IDX_task_deps_unique").on(sql`${table.taskId}, ${table.prerequisiteTaskId}`),
]);

// task_activity.ts - Full audit trail
export const taskActivity = pgTable("task_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action").notNull(), // created, updated, status_changed, assigned, commented, etc.
  fieldName: varchar("field_name"),     // Which field changed (if any)
  oldValue: text("old_value"),         // Previous value
  newValue: text("new_value"),         // New value
  metadata: jsonb("metadata"),         // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_task_activity_task").on(table.taskId),
  index("IDX_task_activity_user").on(table.userId),
  index("IDX_task_activity_created").on(table.createdAt),
]);

// task_attachments.ts - File attachments
export const taskAttachments = pgTable("task_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  fileType: varchar("file_type"),            // MIME type
  objectPath: varchar("object_path").notNull(), // Storage path
  thumbnailPath: varchar("thumbnail_path"),    // For images
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_task_attachments_task").on(table.taskId),
]);

// task_analytics_snapshot.ts - Daily analytics snapshots
export const taskAnalyticsSnapshot = pgTable("task_analytics_snapshot", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotDate: date("snapshot_date").notNull(),
  totalTasks: integer("total_tasks").default(0),
  completedTasks: integer("completed_tasks").default(0),
  overdueTasks: integer("overdue_tasks").default(0),
  avgCompletionTime: integer("avg_completion_time"), // in hours
  tasksByStatus: jsonb("tasks_by_status"), // {todo: 10, in_progress: 5, completed: 20}
  tasksByPriority: jsonb("tasks_by_priority"), // {low: 5, normal: 15, high: 10, urgent: 5}
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_task_analytics_date").on(table.snapshotDate),
]);
```

#### Updated Tasks Table Fields

```typescript
// Add to existing tasks table
// Progress percentage (calculated from checklist completion)
taskProgress: integer("task_progress").default(0), // 0-100

// Estimated hours for workload calculation
estimatedHours: integer("estimated_hours"),

// Tags for filtering
tags: text("tags").array(),

// Start date for Gantt/timeline view
startDate: timestamp("start_date"),

// Flag for blocking when prerequisite incomplete
blocksCompletion: boolean("blocks_completion").default(false),
```

### 1.2 Storage Layer Additions

```typescript
// server/storage.ts additions

// Task Dependencies
async createTaskDependency(data: { taskId: string; prerequisiteTaskId: string; dependencyType?: string }): Promise<TaskDependency>
async getTaskDependencies(taskId: string): Promise<TaskDependency[]>
async getDependentTasks(taskId: string): Promise<TaskDependency[]> // Tasks that depend on this one
async deleteTaskDependency(id: string): Promise<void>
async validateTaskCompletion(taskId: string): Promise<{ valid: boolean; blockedBy: Task[] }>

// Task Activity
async createTaskActivity(data: { taskId: string; userId?: number; action: string; fieldName?: string; oldValue?: string; newValue?: string; metadata?: any }): Promise<TaskActivity>
async getTaskActivity(taskId: string, limit?: number): Promise<TaskActivity[]>
async getUserActivity(userId: number, limit?: number): Promise<TaskActivity[]>

// Task Attachments
async createTaskAttachment(data: { taskId: string; uploadedBy: number; fileName: string; fileSize: number; fileType: string; objectPath: string; thumbnailPath?: string }): Promise<TaskAttachment>
async getTaskAttachments(taskId: string): Promise<TaskAttachment[]>
async deleteTaskAttachment(id: string): Promise<void>

// User Workload
async getUserWorkload(userId: number): Promise<{
  activeTasks: number;
  overdueTasks: number;
  estimatedHoursTotal: number;
  tasksByPriority: Record<string, number>;
  upcomingDeadlines: Task[];
}>
async getAllUsersWorkload(): Promise<Map<number, UserWorkload>>

// Task Analytics
async getTaskAnalytics(dateFrom: Date, dateTo: Date): Promise<TaskAnalytics>
async createAnalyticsSnapshot(): Promise<void>
async getTeamProductivityMetrics(userId?: number): Promise<ProductivityMetrics>

// Advanced Filtering
async searchTasks(filters: {
  status?: string[];
  priority?: string[];
  assigneeId?: number;
  spaceId?: string;
  clientId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  tags?: string[];
  searchText?: string;
  hasDependencies?: boolean;
  isBlocking?: boolean;
}): Promise<Task[]>
```

---

## Phase 2: Backend API Enhancements

### 2.1 New API Endpoints

#### Task Dependencies
```
GET    /api/tasks/:id/dependencies          - Get all dependencies for a task
GET    /api/tasks/:id/dependents             - Get tasks that depend on this task
POST   /api/tasks/:id/dependencies          - Add a dependency
DELETE /api/tasks/:id/dependencies/:depId    - Remove a dependency
GET    /api/tasks/validate-dependencies     - Check if task can be started
```

#### Task Activity
```
GET    /api/tasks/:id/activity               - Get activity history for a task
GET    /api/users/:id/activity               - Get user's activity
GET    /api/tasks/activity-feed              - Get global activity feed
```

#### Task Attachments
```
GET    /api/tasks/:id/attachments            - List attachments
POST   /api/tasks/:id/attachments            - Upload attachment
DELETE /api/tasks/:id/attachments/:attId    - Delete attachment
GET    /api/tasks/:id/attachments/:attId/url - Get download URL
```

#### Workload & Analytics
```
GET    /api/users/:id/workload                - Get user workload metrics
GET    /api/users/workload/all               - Get all users workload
GET    /api/tasks/analytics                  - Get task analytics
GET    /api/tasks/analytics/productivity    - Get productivity metrics
POST   /api/tasks/analytics/snapshot         - Create analytics snapshot
```

#### Advanced Search
```
GET    /api/tasks/search                     - Advanced search with filters
POST   /api/tasks/search/saved              - Save a search filter
GET    /api/tasks/search/saved              - Get saved searches
DELETE /api/tasks/search/saved/:id           - Delete saved search
```

### 2.2 Enhanced Existing Endpoints

#### Task Creation - Add Progress Tracking
```typescript
// POST /api/tasks
interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "review" | "completed";
  priority?: "low" | "normal" | "high" | "urgent";
  dueDate?: string;
  dueTime?: string;
  estimatedHours?: number;
  tags?: string[];
  startDate?: string;
  // New fields
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  dependencies?: string[]; // Array of prerequisite task IDs
  attachments?: File[];
}
```

#### Task Updates - Activity Tracking Middleware
```typescript
// Auto-track all changes in task_activity table
async function trackTaskActivity(
  taskId: string,
  userId: number,
  changes: Record<string, { old: any; new: any }>
) {
  for (const [fieldName, { old: oldValue, new: newValue }] of Object.entries(changes)) {
    await storage.createTaskActivity({
      taskId,
      userId,
      action: 'updated',
      fieldName,
      oldValue: String(oldValue),
      newValue: String(newValue),
    });
  }
}
```

### 2.3 Recurring Tasks Enhancement

```typescript
// Enhanced recurrence patterns
interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // Every N periods
  daysOfWeek?: number[]; // For weekly: [0,1,2,3,4,5,6]
  dayOfMonth?: number; // For monthly: 1-31
  weekOfMonth?: number; // For monthly: first, second, third, fourth, last
  endDate?: Date;
  exceptions?: Date[]; // Skip these dates
  count?: number; // Number of occurrences (instead of endDate)
}

// Add to task recurrence endpoint
router.post("/tasks/:id/recurrence", async (req, res) => {
  const pattern = req.body as RecurrencePattern;
  await storage.updateTaskRecurrence(req.params.id, pattern);
});
```

---

## Phase 3: Frontend Components

### 3.1 New Components

#### TaskKanbanBoard.tsx
```typescript
interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  columns?: KanbanColumn[];
}

// Features:
- Drag-and-drop using @dnd-kit or react-beautiful-dnd
- Customizable columns (add, remove, rename)
- Column filtering and search
- Bulk operations on selected tasks
- Swimlanes for assignees or priorities
- Progress indicators on cards
- Dependency visualization (arrows between cards)
```

#### TaskDependencyGraph.tsx
```typescript
interface TaskDependencyGraphProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
// Visual dependency graph using react-flow
- Nodes: Tasks
- Edges: Dependencies
- Blocking indicators
- Critical path highlighting
```

#### TaskProgressBar.tsx
```typescript
interface TaskProgressBarProps {
  checklist: ChecklistItem[];
  onUpdate: (checklist: ChecklistItem[]) => void;
// Visual progress indicator
- Progress bar (0-100%)
- Subtask count (3/5 completed)
- Expandable checklist view
- Quick-add subtasks
- Drag-to-reorder subtasks
```

#### WorkloadIndicator.tsx
```typescript
interface WorkloadIndicatorProps {
  userId: number;
  compact?: boolean;
// Workload visualization
- Task count badge
- Color-coded workload (green/yellow/red)
- Breakdown by priority
- Upcoming deadlines
- Estimated hours
- Tooltip with details
```

#### TaskFiltersPanel.tsx
```typescript
interface TaskFiltersPanelProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onSave: (name: string, filters: TaskFilters) => void;
  onClear: () => void;
// Advanced filtering
- Status multi-select
- Priority multi-select
- Assignee dropdown
- Date range picker
- Tags input
- Search text
- Toggle: has dependencies, is blocking, overdue
- Save/load filter presets
```

#### TaskActivityTimeline.tsx
```typescript
interface TaskActivityTimelineProps {
  activity: TaskActivity[];
  task: Task;
// Activity feed
- Chronological timeline
- User avatars
- Action icons (created, updated, commented)
- Expandable details
- Filter by activity type
```

#### TaskAttachmentsList.tsx
```typescript
interface TaskAttachmentsListProps {
  attachments: TaskAttachment[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
// File management
- File list with icons
- File type filtering
- Thumbnail previews for images
- Drag-and-drop upload
- Download/delete actions
- File size display
```

#### TaskAnalyticsDashboard.tsx
```typescript
interface TaskAnalyticsDashboardProps {
  dateRange: { from: Date; to: Date };
  userId?: number;
// Analytics visualization
- Completion rate chart
- Tasks by status pie chart
- Priority distribution
- Overdue task alerts
- Team productivity leaderboard
- Burndown chart for sprints
- Average completion time
- Bottleneck identification
```

#### TaskTemplateBuilder.tsx
```typescript
interface TaskTemplateBuilderProps {
  template?: TaskTemplate;
  onSave: (template: TaskTemplate) => void;
// Template creation wizard
- Template name and description
- Default fields (title, description, status, priority)
- Checklist builder
- Recurrence settings
- Dependency templates
- Tags configuration
- Assignee defaults
```

### 3.2 Updated Components

#### TaskDetailSidebar.tsx - Enhanced
```typescript
// Add tabs for:
- Overview (existing)
- Checklist (enhanced with progress)
- Comments (existing)
- Activity (new)
- Attachments (new)
- Dependencies (new)

// New sections:
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="checklist">
      Checklist {progress > 0 && <Badge>{progress}%</Badge>}
    </TabsTrigger>
    <TabsTrigger value="comments">Comments</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="attachments">Files</TabsTrigger>
    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
  </TabsList>
</Tabs>
```

#### TaskSpacesSidebar.tsx - Add Workload
```typescript
// Show task counts per space with workload indicators
<SpaceItem space={space}>
  <TaskCountBadge count={taskCount} />
  <WorkloadIndicator userId={currentUser?.id} compact />
</SpaceItem>

// Add quick filters
<QuickFilter label="My Tasks" filter={{ assigneeId: currentUser?.id }} />
<QuickFilter label="Overdue" filter={{ status: ['todo', 'in_progress'], overdue: true }} />
<QuickFilter label="Blocking" filter={{ isBlocking: true }} />
```

### 3.3 Updated Tasks Page

```typescript
// client/src/pages/tasks.tsx

interface TasksPageState {
  viewMode: 'list' | 'board' | 'calendar' | 'gantt';
  selectedTask: Task | null;
  filters: TaskFilters;
  showFiltersPanel: boolean;
  showAnalytics: boolean;
}

// Enhanced features:
- View mode switcher (list, board, calendar, gantt)
- Advanced filter panel
- Bulk actions toolbar
- Task analytics sidebar
- Dependency graph toggle
- Activity feed panel
```

---

## Phase 4: User Experience Enhancements

### 4.1 Visual Priority Indicators

```typescript
// Color scheme for priorities
const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  normal: 'bg-gray-100 text-gray-800 border-gray-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

// Priority badges with icons
const priorityIcons = {
  low: <ArrowDownIcon className="w-3 h-3" />,
  normal: <MinusIcon className="w-3 h-3" />,
  high: <ArrowUpIcon className="w-3 h-3" />,
  urgent: <FlameIcon className="w-3 h-3" />,
};
```

### 4.2 Dependency Blocking Visualization

```typescript
// Visual indicators for blocking
<TaskCard
  task={task}
  blocked={task.isBlocked}
  blocking={task.isBlocking}
  blockedBy={task.blockedByTask}
  onClick={handleTaskClick}
/>

// Blocked overlay
{isBlocked && (
  <div className="absolute inset-0 bg-gray-500/50 flex items-center justify-center">
    <Tooltip content={`Blocked by: ${blockedByTask.title}`}>
      <LockIcon className="w-6 h-6 text-red-500" />
    </Tooltip>
  </div>
)}
```

### 4.3 Workload Balance Suggestions

```typescript
// Suggest task reassignment when overloaded
const WorkloadBalanceAlert = ({ userId, tasks }) => {
  const isOverloaded = tasks.length > 10;
  
  if (!isOverloaded) return null;
  
  return (
    <Alert>
      <AlertTitle>High workload detected</AlertTitle>
      <AlertDescription>
        This user has {tasks.length} active tasks.
        <Button onClick={showReassignmentSuggestions}>
          Suggest reassignments
        </Button>
      </AlertDescription>
    </Alert>
  );
};
```

### 4.4 Smart Notifications

```typescript
// Enhanced notification rules
const notificationRules = {
  taskAssigned: { email: true, push: true, inApp: true },
  taskDueSoon: { email: true, push: true, inApp: true },
  taskOverdue: { email: true, push: true, inApp: true },
  dependencyResolved: { email: false, push: true, inApp: true },
  taskMentioned: { email: true, push: true, inApp: true },
  fileAttached: { email: false, push: false, inApp: true },
  milestoneReached: { email: true, push: true, inApp: true },
};

// User-configurable in notification preferences
```

---

## Phase 5: Implementation Roadmap

### Phase 5.1: Foundation (Week 1-2)
1. Create database migrations for new tables
2. Add storage layer methods
3. Create API endpoints for dependencies
4. Add activity tracking middleware
5. Basic task attachment upload

### Phase 5.2: Kanban & UI (Week 3-4)
1. Implement TaskKanbanBoard component
2. Add drag-and-drop functionality
3. Create TaskProgressBar component
4. Build WorkloadIndicator component
5. Update TaskDetailSidebar with tabs

### Phase 5.3: Search & Filtering (Week 5)
1. Implement advanced search API
2. Create TaskFiltersPanel component
3. Add saved filters functionality
4. Build filter presets UI

### Phase 5.4: Analytics & Reporting (Week 6)
1. Implement analytics calculations
2. Create TaskAnalyticsDashboard
3. Add productivity metrics
4. Build export functionality (CSV, PDF)

### Phase 5.5: Polish & Integration (Week 7-8)
1. Integrate workload balancing suggestions
2. Add Gantt/timeline view
3. Implement dependency graph visualization
4. User testing and bug fixes
5. Documentation updates

---

## File Structure Changes

```
client/src/
├── components/
│   ├── tasks/
│   │   ├── TaskKanbanBoard.tsx        # NEW
│   │   ├── TaskDependencyGraph.tsx     # NEW
│   │   ├── TaskProgressBar.tsx         # NEW
│   │   ├── WorkloadIndicator.tsx      # NEW
│   │   ├── TaskFiltersPanel.tsx       # NEW
│   │   ├── TaskActivityTimeline.tsx   # NEW
│   │   ├── TaskAttachmentsList.tsx   # NEW
│   │   ├── TaskAnalyticsDashboard.tsx # NEW
│   │   ├── TaskTemplateBuilder.tsx    # NEW
│   │   └── TaskCard.tsx               # ENHANCED
│   └── ui/
│       └── [existing components]
├── pages/
│   └── tasks.tsx                      # ENHANCED
└── lib/
    └── task-utils.ts                  # NEW

server/
├── routes/
│   ├── tasks.ts                       # ENHANCED
│   └── task-analytics.ts              # NEW
├── lib/
│   ├── task-dependencies.ts           # NEW
│   ├── task-activity.ts               # NEW
│   └── task-workload.ts               # NEW
└── storage.ts                         # ENHANCED

shared/
├── schema.ts                          # ENHANCED
└── types.ts                           # NEW (if needed)
```

---

## Testing Strategy

### Unit Tests
- Task dependency validation logic
- Progress calculation algorithms
- Workload metrics calculations
- Recurrence pattern parsing

### Integration Tests
- API endpoints for all new routes
- File upload/download flow
- Activity tracking persistence
- Real-time workload updates

### E2E Tests
- Complete Kanban board workflow
- Task creation with dependencies
- Advanced filtering scenarios
- Analytics dashboard data accuracy

---

## Performance Considerations

### Database
- Indexes on all foreign keys
- Composite indexes for common queries
- Pagination for activity feeds
- Archiving old activity records

### Frontend
- Virtual scrolling for large task lists
- Lazy loading for components
- Optimistic updates for drag-drop
- Debounced search inputs

### Caching
- Cache user workload data (5-minute TTL)
- Cache analytics snapshots (1-hour TTL)
- Invalidate on task updates

---

## Security Considerations

### File Uploads
- Validate file types (whitelist)
- Size limits (max 10MB per file)
- Virus scanning integration
- Secure storage with signed URLs

### Access Control
- Check dependency access (can user see prerequisite?)
- Filter activity by user permissions
- Validate attachment deletion ownership

### Data Privacy
- Audit log for all task changes
- Soft delete for attachments
- Rate limiting on upload endpoints
