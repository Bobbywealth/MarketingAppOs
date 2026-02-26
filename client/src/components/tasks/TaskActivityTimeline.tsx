import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  MessageSquare,
  UserPlus,
  UserMinus,
  Flag,
  Calendar,
  Paperclip,
  Link,
  Link2,
  CheckCircle2,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { TaskActivityType as TaskActivity, User } from "@shared/schema";

interface TaskActivityTimelineProps {
  taskId: string;
  limit?: number;
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="w-4 h-4 text-green-500" />,
  updated: <Edit2 className="w-4 h-4 text-blue-500" />,
  status_changed: <CheckCircle2 className="w-4 h-4 text-purple-500" />,
  assigned: <UserPlus className="w-4 h-4 text-green-500" />,
  unassigned: <UserMinus className="w-4 h-4 text-gray-500" />,
  priority_changed: <Flag className="w-4 h-4 text-orange-500" />,
  due_date_changed: <Calendar className="w-4 h-4 text-blue-500" />,
  commented: <MessageSquare className="w-4 h-4 text-blue-500" />,
  attachment_added: <Paperclip className="w-4 h-4 text-green-500" />,
  attachment_removed: <Trash2 className="w-4 h-4 text-red-500" />,
  dependency_added: <Link className="w-4 h-4 text-blue-500" />,
  dependency_removed: <Link2 className="w-4 h-4 text-gray-500" />,
  subtask_added: <Plus className="w-4 h-4 text-green-500" />,
  subtask_completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

const actionLabels: Record<string, string> = {
  created: "created this task",
  updated: "updated",
  status_changed: "changed status",
  assigned: "assigned to",
  unassigned: "unassigned",
  priority_changed: "changed priority",
  due_date_changed: "changed due date",
  commented: "commented",
  attachment_added: "added attachment",
  attachment_removed: "removed attachment",
  dependency_added: "added dependency",
  dependency_removed: "removed dependency",
  subtask_added: "added subtask",
  subtask_completed: "completed subtask",
};

interface ActivityWithUser extends TaskActivity {
  user?: User | null;
}

export function TaskActivityTimeline({
  taskId,
  limit = 50,
}: TaskActivityTimelineProps) {
  const { data: activity = [], isLoading, error } = useQuery<ActivityWithUser[]>({
    queryKey: [`/api/tasks/${taskId}/activity`, { limit }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tasks/${taskId}/activity?limit=${limit}`);
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || activity.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-400px)] pr-4">
      <div className="space-y-4">
        {activity.map((item, index) => (
          <ActivityItem key={item.id} item={item} isFirst={index === 0} />
        ))}
      </div>
    </ScrollArea>
  );
}

interface ActivityItemProps {
  item: ActivityWithUser;
  isFirst: boolean;
}

function ActivityItem({ item, isFirst }: ActivityItemProps) {
  const userInitials = item.user
    ? `${item.user.firstName?.[0] || ""}${item.user.lastName?.[0] || ""}`
    : "?";
  const userName = item.user
    ? `${item.user.firstName || item.user.username}`
    : "System";
  const icon = actionIcons[item.action] || <Edit2 className="w-4 h-4" />;
  const label = actionLabels[item.action] || item.action;

  const formatFieldChange = () => {
    if (!item.fieldName) return null;

    const fieldLabel = item.fieldName.replace(/([A-Z])/g, " $1").trim();
    const oldValue = item.oldValue || "(none)";
    const newValue = item.newValue || "(none)";

    return (
      <div className="mt-1 text-xs text-muted-foreground">
        <span className="font-medium">{fieldLabel}:</span>{" "}
        <span className="line-through">{oldValue}</span> →{" "}
        <span className="text-foreground">{newValue}</span>
      </div>
    );
  };

  return (
    <div className="relative pl-6">
      {/* Timeline connector */}
      {!isFirst && (
        <div className="absolute left-[7px] top-8 bottom-[-16px] w-px bg-border" />
      )}

      {/* Avatar with icon overlay */}
      <div className="absolute left-0 top-0">
        <Avatar className="w-6 h-6">
          <AvatarFallback className="text-xs">
            {userInitials.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="pb-4">
        <div className="flex items-start gap-2">
          <span className="font-medium text-sm">{userName}</span>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>

        {item.fieldName && formatFieldChange()}

        {item.newValue && !item.fieldName && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {item.newValue}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
          {new Date(item.createdAt).getTime() > Date.now() - 3600000 && (
            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
              New
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Activity Feed Widget (for sidebar)
interface ActivityFeedProps {
  userId?: number;
  limit?: number;
}

export function ActivityFeed({ userId, limit = 20 }: ActivityFeedProps) {
  const endpoint = userId
    ? `/api/users/${userId}/activity?limit=${limit}`
    : `/api/tasks/activity-feed?limit=${limit}`;

  const { data: activity = [], isLoading } = useQuery<ActivityWithUser[]>({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await apiRequest("GET", endpoint);
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activity.slice(0, 10).map((item) => (
        <ActivityItem key={item.id} item={item} isFirst={false} />
      ))}
      {activity.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No recent activity
        </p>
      )}
    </div>
  );
}

export default TaskActivityTimeline;
