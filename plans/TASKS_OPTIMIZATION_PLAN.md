# Tasks Performance Optimization Plan

## Executive Summary

This plan addresses critical performance issues and architectural improvements for the Tasks feature. The current implementation has a **3-second polling cycle** generating ~1,200 requests/hour per user, and the main `tasks.tsx` component has grown to **2,214 lines** of code.

---

## Phase 1: Critical Performance Fixes (Under 1 Week)

### 1.1 Increase Polling Interval

**Current State:**
```typescript
const { data: tasks = [] } = useQuery<Task[]>({
  queryKey: ["/api/tasks"],
  refetchInterval: 3000, // Poll every 3 seconds
});
```

**Recommended Changes:**

1. Increase default interval to **15-30 seconds**:
```typescript
refetchInterval: 15000, // 15 seconds for active users
```

2. Add smart polling based on activity:
```typescript
refetchInterval: (data) => {
  if (!data || data.length === 0) return 30000; // Less frequent for empty
  return 15000; // Standard interval
}
```

3. Disable background polling when tab is hidden:
```typescript
refetchOnWindowFocus: true, // Only refresh when user returns
refetchIntervalInBackground: false, // Stop when tab hidden
```

### 1.2 Add React.memo() to TaskCard Component

**Impact:** Prevents unnecessary re-renders when parent state changes

```typescript
// TaskCard.tsx
import { memo } from 'react';

export const TaskCard = memo(function TaskCard({ task, onClick }: TaskCardProps) {
  // ... component logic
});

// Usage in Kanban
<TaskCard key={task.id} task={task} onClick={handleTaskClick} />
```

### 1.3 Implement Virtual Scrolling for Large Lists

For boards with 100+ tasks, use `@tanstack/react-virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef(null);
const rowVirtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120, // Estimated card height
});
```

---

## Phase 2: Component Decomposition (1-2 Weeks)

### 2.1 Extract Sub-Components from tasks.tsx

**Current Structure (2,214 lines):**
```
tasks.tsx
├── Task Form (lines 92-250)
├── Task List (lines 260-500)
├── Kanban Board (lines 500-900)
├── Filters Panel (lines 900-1100)
├── Bulk Actions (lines 1100-1300)
├── Dialogs/Modals (lines 1300-1800)
└── Utility functions (lines 1800-2214)
```

**Proposed Structure:**
```
client/src/components/tasks/
├── TaskCard.tsx              # Individual task display
├── TaskKanbanColumn.tsx      # Kanban column with drop logic
├── TaskKanbanBoard.tsx      # Main board layout
├── TaskListView.tsx         # List view alternative
├── TaskFiltersPanel.tsx     # Already exists
├── TaskBulkActions.tsx      # Bulk operations toolbar
├── TaskCreateForm.tsx       # Create/edit task form
├── TaskRecurringConfig.tsx   # Recurring settings
└── index.ts                 # Barrel exports
```

### 2.2 Component Extraction Priority

| Component | Current Lines | Priority | Complexity |
|-----------|--------------|----------|------------|
| TaskCard | 200 | HIGH | Low |
| TaskKanbanColumn | 150 | HIGH | Medium |
| TaskBulkActions | 100 | HIGH | Low |
| TaskCreateForm | 150 | MEDIUM | Medium |
| TaskRecurringConfig | 80 | MEDIUM | Low |

---

## Phase 3: Optimistic UI Updates (1 Week)

### 3.1 Implement with useMutation

**Current Pattern (Blocking):**
```typescript
const updateTask = useMutation({
  mutationFn: (task: Task) => 
    apiRequest(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify(task),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
  },
});
```

**Optimized Pattern:**
```typescript
const updateTask = useMutation({
  mutationFn: updateTaskInDB,
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['/api/tasks'] });
    
    // Snapshot previous value
    const previousTasks = queryClient.getQueryData(['/api/tasks']);
    
    // Optimistically update
    queryClient.setQueryData(['/api/tasks'], (old: Task[]) => 
      old.map(t => t.id === newTask.id ? { ...t, ...newTask } : t)
    );
    
    return { previousTasks };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['/api/tasks'], context.previousTasks);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
  },
});
```

### 3.2 Drag-Drop Optimistic Updates

For Kanban drag-and-drop:
```typescript
const handleDragEnd = useCallback(async (result) => {
  if (!result.destination) return;
  
  const { draggableId, destination } = result;
  
  // Optimistic update - immediately move card
  setTasks(prev => {
    const draggedTask = prev.find(t => t.id === draggableId);
    if (!draggedTask) return prev;
    
    return prev.map(t => 
      t.id === draggableId 
        ? { ...t, status: destination.droppableId }
        : t
    );
  });
  
  // Server update (fire-and-forget with error handling)
  try {
    await apiRequest(`/api/tasks/${draggableId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: destination.droppableId }),
    });
  } catch (error) {
    // Revert on error
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
  }
}, [queryClient]);
```

---

## Phase 4: Bulk Operations API (1 Week)

### 4.1 Server-Side Endpoints

**New Route: `PATCH /api/tasks/bulk`**

```typescript
// server/routes/tasks.ts

router.patch('/bulk', async (req: Request, res: Response) => {
  const { taskIds, updates } = req.body;
  
  const results = await storage.bulkUpdateTasks(taskIds, updates);
  
  res.json({
    success: true,
    updated: results.length,
    tasks: results,
  });
});

router.delete('/bulk', async (req: Request, res: Response) => {
  const { taskIds } = req.body;
  
  const results = await storage.bulkDeleteTasks(taskIds);
  
  res.json({
    success: true,
    deleted: results.length,
  });
});
```

### 4.2 Storage Layer Implementation

```typescript
// server/storage.ts

async bulkUpdateTasks(
  taskIds: string[], 
  updates: Partial<Task>
): Promise<Task[]> {
  const results = await db
    .update(tasks)
    .set({ ...updates, updatedAt: new Date() })
    .where(inArray(tasks.id, taskIds))
    .returning();
    
  return results;
}

async bulkDeleteTasks(taskIds: string[]): Promise<number> {
  const result = await db
    .delete(tasks)
    .where(inArray(tasks.id, taskIds));
    
  return result.rowCount || 0;
}
```

### 4.3 Client-Side Integration

```typescript
// hooks/useBulkTasks.ts

export function useBulkTasks() {
  const queryClient = useQueryClient();
  
  const bulkUpdate = useMutation({
    mutationFn: async ({ taskIds, updates }: { taskIds: string[]; updates: Partial<Task> }) => {
      return apiRequest('/api/tasks/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ taskIds, updates }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast.success('Tasks updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tasks');
    },
  });
  
  return bulkUpdate;
}
```

---

## Phase 5: Background Job for Recurring Tasks (2 Weeks)

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Background Job System                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Scheduler  │───▶│  Job Queue   │───▶│  Processor  │  │
│  │  (cron)      │    │  (Bull/Redis)│    │  (Worker)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                        │          │
│         │                                        │          │
│         ▼                                        ▼          │
│  ┌──────────────┐                      ┌──────────────┐    │
│  │ Recurring    │                      │  Create      │    │
│  │ Task Table   │                      │  Task        │    │
│  └──────────────┘                      └──────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Implementation Steps

**Step 1: Create Recurring Task Processor**
```typescript
// server/jobs/processRecurringTasks.ts

interface RecurringConfig {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N periods
  scheduleFrom: 'due_date' | 'completion_date';
  endDate?: Date;
}

export async function processRecurringTasks() {
  const today = new Date();
  
  // Find recurring tasks that need generation
  const tasksToGenerate = await storage.findRecurringTasksNeedingGeneration(today);
  
  for (const task of tasksToGenerate) {
    const newTask = await generateNextRecurringInstance(task);
    await storage.createTask(newTask);
    
    // Update last generated date
    await storage.updateTask(task.id, {
      lastGeneratedAt: today,
    });
  }
  
  return tasksToGenerate.length;
}
```

**Step 2: Scheduler Setup**
```typescript
// server/index.ts

import cron from 'node-cron';

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running recurring task processor...');
  await processRecurringTasks();
});
```

**Step 3: Remove On-Load Generation**
Remove from `tasks.tsx`:
```typescript
// REMOVE THIS:
useEffect(() => {
  const generateRecurring = async () => {
    await apiRequest('/api/tasks/generate-recurring', {
      method: 'POST',
    });
  };
  generateRecurring();
}, []);
```

---

## Phase 6: Real-Time Updates with WebSocket (Optional - Month 2)

### 6.1 Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │◀───▶│  WebSocket  │◀───▶│   Server    │
│  (Browser)  │     │   Server    │     │  (Tasks)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Redis     │
                    │   Pub/Sub   │
                    └─────────────┘
```

### 6.2 Implementation

```typescript
// hooks/useTaskSubscription.ts

export function useTaskSubscription() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/tasks`);
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      
      switch (type) {
        case 'TASK_CREATED':
          queryClient.setQueryData(['/api/tasks'], (old: Task[]) => 
            [...old, data]
          );
          break;
        case 'TASK_UPDATED':
          queryClient.setQueryData(['/api/tasks'], (old: Task[]) => 
            old.map(t => t.id === data.id ? data : t)
          );
          break;
        case 'TASK_DELETED':
          queryClient.setQueryData(['/api/tasks'], (old: Task[]) => 
            old.filter(t => t.id !== data.id)
          );
          break;
      }
    };
    
    return () => ws.close();
  }, [queryClient]);
}
```

---

## Summary of Changes

### Files to Create/Modify

| File | Type | Priority |
|------|------|----------|
| `client/src/components/tasks/TaskCard.tsx` | CREATE | P1 |
| `client/src/components/tasks/TaskKanbanColumn.tsx` | CREATE | P1 |
| `client/src/components/tasks/TaskBulkActions.tsx` | CREATE | P1 |
| `client/src/components/tasks/TaskCreateForm.tsx` | CREATE | P2 |
| `client/src/components/tasks/index.ts` | CREATE | P2 |
| `client/src/pages/tasks.tsx` | MODIFY | P1 |
| `server/routes/tasks.ts` | MODIFY | P1 |
| `server/storage.ts` | MODIFY | P1 |
| `server/jobs/processRecurringTasks.ts` | CREATE | P3 |
| `scripts/add-missing-indexes.sql` | CREATE | P1 |

### Performance Impact

| Optimization | Current | After | Improvement |
|-------------|---------|-------|-------------|
| API Requests/Hour | 1,200 | ~240 | **80% reduction** |
| Re-renders/Change | All tasks | Only affected | **~70% reduction** |
| Task Creation Time | 500ms (blocking) | 50ms (optimistic) | **90% faster** |
| Duplicate Tasks | Common | None | **100% fix** |

### Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 1 week | Polling optimization, memo, virtual scroll |
| Phase 2 | 1-2 weeks | Component decomposition |
| Phase 3 | 1 week | Optimistic UI updates |
| Phase 4 | 1 week | Bulk operations API |
| Phase 5 | 2 weeks | Background job system |
| Phase 6 | 2 weeks | WebSocket real-time (optional) |
