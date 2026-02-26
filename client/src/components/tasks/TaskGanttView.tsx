import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  GanttChart,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Lock,
  User,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  differenceInDays,
  startOfWeek,
  min,
  max,
  parseISO,
} from "date-fns";
import type { Task, User as UserType } from "@shared/schema";

interface TaskGanttViewProps {
  tasks: Task[];
  users?: UserType[];
  onTaskClick?: (task: Task) => void;
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-200",
  in_progress: "bg-blue-400",
  review: "bg-yellow-400",
  completed: "bg-green-400",
};

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-blue-400",
  normal: "border-gray-400",
  high: "border-orange-400",
  urgent: "border-red-400",
};

const PRIORITY_BG: Record<string, string> = {
  low: "bg-blue-50",
  normal: "bg-gray-50",
  high: "bg-orange-50",
  urgent: "bg-red-50",
};

export function TaskGanttView({ tasks, users = [], onTaskClick }: TaskGanttViewProps) {
  const [startDate, setStartDate] = useState(startOfWeek(new Date()));
  const [visibleDays, setVisibleDays] = useState(21); // 3 weeks
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter tasks with dates
  const tasksWithDates = useMemo(() => {
    return tasks.filter(task => task.dueDate || task.startDate);
  }, [tasks]);

  // Calculate date range
  const dateRange = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < visibleDays; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  }, [startDate, visibleDays]);

  // Get all tasks within visible range, sorted by start date
  const sortedTasks = useMemo(() => {
    return [...tasksWithDates].sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate) : new Date(a.dueDate!);
      const bStart = b.startDate ? new Date(b.startDate) : new Date(b.dueDate!);
      return aStart.getTime() - bStart.getTime();
    });
  }, [tasksWithDates]);

  const navigateWeeks = (direction: "prev" | "next") => {
    setStartDate(prev => direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  const goToToday = () => {
    setStartDate(startOfWeek(new Date()));
  };

  const getTaskPosition = (task: Task) => {
    const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
    const taskEnd = new Date(task.dueDate || task.startDate!);
    
    const startOffset = differenceInDays(taskStart, startDate);
    const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
    
    return {
      left: `${(startOffset / visibleDays) * 100}%`,
      width: `${(duration / visibleDays) * 100}%`,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case "in_progress":
        return <Circle className="h-3.5 w-3.5 text-blue-600 fill-current" />;
      case "review":
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || user.username}` : `User ${userId}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GanttChart className="h-5 w-5" />
            Timeline View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigateWeeks("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[160px] text-center">
                {format(startDate, "MMM d")} - {format(addDays(startDate, visibleDays - 1), "MMM d, yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateWeeks("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={visibleDays}
                onChange={(e) => setVisibleDays(Number(e.target.value))}
              >
                <option value={14}>2 weeks</option>
                <option value={21}>3 weeks</option>
                <option value={28}>4 weeks</option>
                <option value={42}>6 weeks</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          {/* Task list column */}
          <div className="w-[250px] min-w-[250px] border-r flex-shrink-0">
            {/* Header */}
            <div className="h-12 border-b bg-muted/50 px-3 flex items-center">
              <span className="text-sm font-medium">Task</span>
            </div>
            {/* Task names */}
            <ScrollArea className="h-[calc(100%-48px)]" ref={scrollRef}>
              {sortedTasks.map(task => (
                <div
                  key={task.id}
                  className={`
                    h-14 border-b px-3 py-2 flex flex-col justify-center cursor-pointer
                    hover:bg-muted/50 transition-colors
                    ${PRIORITY_BG[task.priority || "normal"]}
                  `}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className="text-sm font-medium truncate flex-1">
                      {task.title}
                    </span>
                    {task.blocksCompletion && (
                      <Lock className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <User className="h-3 w-3" />
                    <span className="truncate">{getUserName(task.assignedToId)}</span>
                  </div>
                </div>
              ))}
              {sortedTasks.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No tasks with dates to display
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Gantt chart area */}
          <div className="flex-1 overflow-x-auto">
            {/* Date headers */}
            <div className="h-12 border-b bg-muted/50 flex sticky top-0">
              {dateRange.map((date, index) => (
                <div
                  key={index}
                  className={`
                    flex-1 min-w-[40px] flex flex-col items-center justify-center
                    border-r last:border-r-0
                    ${isToday(date) ? "bg-primary/10" : ""}
                    ${isWeekend(date) ? "bg-muted/30" : ""}
                  `}
                >
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {format(date, "EEE")}
                  </span>
                  <span className={`text-sm ${isToday(date) ? "font-bold text-primary" : ""}`}>
                    {format(date, "d")}
                  </span>
                </div>
              ))}
            </div>

            {/* Task bars */}
            <ScrollArea className="h-[calc(100%-48px)]">
              <div className="relative" style={{ height: `${sortedTasks.length * 56}px` }}>
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {dateRange.map((date, index) => (
                    <div
                      key={index}
                      className={`
                        flex-1 min-w-[40px] border-r last:border-r-0
                        ${isToday(date) ? "bg-primary/5" : ""}
                        ${isWeekend(date) ? "bg-muted/20" : ""}
                      `}
                    />
                  ))}
                </div>

                {/* Today line */}
                {dateRange.some(d => isToday(d)) && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                    style={{
                      left: `${(differenceInDays(new Date(), startDate) / visibleDays) * 100}%`,
                    }}
                  />
                )}

                {/* Task bars */}
                {sortedTasks.map((task, index) => {
                  const position = getTaskPosition(task);
                  return (
                    <TooltipProvider key={task.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              absolute h-8 rounded cursor-pointer
                              flex items-center px-2 gap-1
                              border-l-2 ${PRIORITY_BORDER[task.priority || "normal"]}
                              ${STATUS_COLORS[task.status]}
                              hover:opacity-80 transition-opacity
                              ${task.status === "completed" ? "opacity-60" : ""}
                            `}
                            style={{
                              top: `${index * 56 + 12}px`,
                              left: position.left,
                              width: position.width,
                              minWidth: "20px",
                            }}
                            onClick={() => onTaskClick?.(task)}
                          >
                            {task.status === "completed" && (
                              <CheckCircle2 className="h-3 w-3 text-green-700 flex-shrink-0" />
                            )}
                            <span className="text-xs truncate text-gray-800">
                              {task.title}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs space-y-1">
                            <p className="font-medium">{task.title}</p>
                            <p>Status: {task.status}</p>
                            <p>Priority: {task.priority}</p>
                            {task.startDate && (
                              <p>Start: {format(new Date(task.startDate), "MMM d, yyyy")}</p>
                            )}
                            {task.dueDate && (
                              <p>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Legend */}
        <div className="p-3 border-t flex items-center gap-4 text-xs">
          <span className="font-medium">Status:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-gray-200 rounded" />
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-blue-400 rounded" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-yellow-400 rounded" />
            <span>Review</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-green-400 rounded" />
            <span>Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskGanttView;
