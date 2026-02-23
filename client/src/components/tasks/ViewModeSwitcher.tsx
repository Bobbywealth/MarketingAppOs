import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  List,
  LayoutGrid,
  Calendar,
  GanttChart,
  BarChart3,
} from "lucide-react";

export type ViewMode = "list" | "board" | "calendar" | "gantt" | "analytics";

interface ViewModeSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  showAnalytics?: boolean;
  className?: string;
}

const viewModes: Array<{ value: ViewMode; label: string; icon: React.ElementType; description: string }> = [
  { value: "list", label: "List", icon: List, description: "Traditional list view with sorting" },
  { value: "board", label: "Board", icon: LayoutGrid, description: "Kanban board with drag-and-drop" },
  { value: "calendar", label: "Calendar", icon: Calendar, description: "Monthly calendar view" },
  { value: "gantt", label: "Timeline", icon: GanttChart, description: "Gantt chart timeline view" },
];

export function ViewModeSwitcher({ 
  value, 
  onChange, 
  showAnalytics = true,
  className = "" 
}: ViewModeSwitcherProps) {
  const availableModes = showAnalytics 
    ? [...viewModes, { value: "analytics" as ViewMode, label: "Analytics", icon: BarChart3, description: "Task analytics dashboard" }]
    : viewModes;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <TooltipProvider>
        {availableModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = value === mode.value;
          
          return (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onChange(mode.value)}
                  className={`gap-1.5 ${isActive ? "" : "text-muted-foreground"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{mode.label}</p>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

// Compact dropdown version for smaller screens
export function ViewModeDropdown({ 
  value, 
  onChange, 
  showAnalytics = true,
  className = "" 
}: ViewModeSwitcherProps) {
  const availableModes = showAnalytics 
    ? [...viewModes, { value: "analytics" as ViewMode, label: "Analytics", icon: BarChart3, description: "Task analytics dashboard" }]
    : viewModes;

  const currentMode = availableModes.find(m => m.value === value);
  const CurrentIcon = currentMode?.icon || List;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as ViewMode)}>
      <SelectTrigger className={`w-[140px] ${className}`}>
        <CurrentIcon className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select view" />
      </SelectTrigger>
      <SelectContent>
        {availableModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <SelectItem key={mode.value} value={mode.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{mode.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export default ViewModeSwitcher;
