import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowDown,
  Minus,
  ArrowUp,
  Flame,
  SignalLow,
  SignalMedium,
  SignalHigh,
  AlertCircle,
} from "lucide-react";

type Priority = "low" | "normal" | "high" | "urgent";

interface TaskPriorityBadgeProps {
  priority: Priority | string;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PRIORITY_CONFIG: Record<Priority, {
  label: string;
  colors: string;
  icon: React.ElementType;
  iconColor: string;
  description: string;
}> = {
  low: {
    label: "Low",
    colors: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    icon: ArrowDown,
    iconColor: "text-blue-500",
    description: "Low priority - can be done when time permits",
  },
  normal: {
    label: "Normal",
    colors: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
    icon: Minus,
    iconColor: "text-gray-500",
    description: "Normal priority - standard task timeline",
  },
  high: {
    label: "High",
    colors: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    icon: ArrowUp,
    iconColor: "text-orange-500",
    description: "High priority - should be completed soon",
  },
  urgent: {
    label: "Urgent",
    colors: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    icon: Flame,
    iconColor: "text-red-500",
    description: "Urgent priority - requires immediate attention",
  },
};

const SIZE_CONFIG: Record<string, { badge: string; icon: string; text: string }> = {
  sm: { badge: "px-1.5 py-0.5 text-[10px]", icon: "h-2.5 w-2.5", text: "text-[10px]" },
  md: { badge: "px-2 py-0.5 text-xs", icon: "h-3 w-3", text: "text-xs" },
  lg: { badge: "px-2.5 py-1 text-sm", icon: "h-3.5 w-3.5", text: "text-sm" },
};

export function TaskPriorityBadge({
  priority,
  showIcon = true,
  showLabel = true,
  size = "md",
  className = "",
}: TaskPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority as Priority] || PRIORITY_CONFIG.normal;
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={`
        ${config.colors}
        ${sizeConfig.badge}
        font-medium gap-1 items-center inline-flex
        transition-colors
        ${className}
      `}
    >
      {showIcon && <Icon className={`${sizeConfig.icon} ${config.iconColor}`} />}
      {showLabel && <span className={sizeConfig.text}>{config.label}</span>}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{config.label} Priority</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for table cells and tight spaces
export function TaskPriorityDot({ priority, size = "md" }: { priority: Priority | string; size?: "sm" | "md" | "lg" }) {
  const config = PRIORITY_CONFIG[priority as Priority] || PRIORITY_CONFIG.normal;
  const dotSize = size === "sm" ? "w-2 h-2" : size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`${dotSize} rounded-full ${config.iconColor.replace('text-', 'bg-')}`}
            title={`${config.label} priority`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label} Priority</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Signal strength style priority indicator
export function TaskPrioritySignal({ priority }: { priority: Priority | string }) {
  const config = PRIORITY_CONFIG[priority as Priority] || PRIORITY_CONFIG.normal;
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`p-1 rounded ${config.colors}`}>
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label} Priority</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Get priority config for external use
export function getPriorityConfig(priority: Priority | string) {
  return PRIORITY_CONFIG[priority as Priority] || PRIORITY_CONFIG.normal;
}

export default TaskPriorityBadge;
