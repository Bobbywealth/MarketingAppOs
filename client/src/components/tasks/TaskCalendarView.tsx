import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import type { Task } from "@shared/schema";

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800 border-gray-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  review: "bg-yellow-100 text-yellow-800 border-yellow-300",
  completed: "bg-green-100 text-green-800 border-green-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "border-l-blue-400",
  normal: "border-l-gray-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-400",
};

export function TaskCalendarView({ tasks, onTaskClick, onDateClick }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  // Get tasks grouped by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        const existing = grouped.get(dateKey) || [];
        grouped.set(dateKey, [...existing, task]);
      }
    });
    
    return grouped;
  }, [tasks]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDay = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return tasksByDate.get(dateKey) || [];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case "in_progress":
        return <Circle className="h-3 w-3 text-blue-500 fill-current" />;
      case "review":
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Task Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(day => (
            <div
              key={day}
              className="p-2 text-center text-xs font-semibold text-muted-foreground uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] border-r border-b p-1
                  ${!isCurrentMonth ? "bg-muted/30" : ""}
                  ${isCurrentDay ? "bg-primary/5" : ""}
                  cursor-pointer hover:bg-muted/50 transition-colors
                `}
                onClick={() => onDateClick?.(day)}
              >
                <div
                  className={`
                    text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                    ${isCurrentDay ? "bg-primary text-primary-foreground" : ""}
                    ${!isCurrentMonth ? "text-muted-foreground" : ""}
                  `}
                >
                  {format(day, "d")}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className={`
                        text-xs p-1 rounded border-l-2 truncate cursor-pointer
                        ${PRIORITY_COLORS[task.priority || "normal"]}
                        ${task.status === "completed" ? "opacity-60 line-through" : ""}
                        hover:bg-muted/50
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick?.(task);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(task.status)}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-3 border-t flex items-center gap-4 text-xs">
          <span className="font-medium">Priority:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-l-2 border-l-blue-400 bg-muted/30" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-l-2 border-l-gray-400 bg-muted/30" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-l-2 border-l-orange-400 bg-muted/30" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-l-2 border-l-red-400 bg-muted/30" />
            <span>Urgent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskCalendarView;
