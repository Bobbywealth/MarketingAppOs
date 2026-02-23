import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  FileText,
  Users,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  taskAssigned: NotificationChannel;
  taskDueSoon: NotificationChannel;
  taskOverdue: NotificationChannel;
  taskCompleted: NotificationChannel;
  taskMentioned: NotificationChannel;
  taskCommented: NotificationChannel;
  fileAttached: NotificationChannel;
  dependencyResolved: NotificationChannel;
  milestoneReached: NotificationChannel;
  weeklyDigest: NotificationChannel;
}

interface NotificationChannel {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

const defaultPreferences: NotificationPreferences = {
  taskAssigned: { email: true, push: true, inApp: true },
  taskDueSoon: { email: true, push: true, inApp: true },
  taskOverdue: { email: true, push: true, inApp: true },
  taskCompleted: { email: false, push: false, inApp: true },
  taskMentioned: { email: true, push: true, inApp: true },
  taskCommented: { email: false, push: true, inApp: true },
  fileAttached: { email: false, push: false, inApp: true },
  dependencyResolved: { email: false, push: true, inApp: true },
  milestoneReached: { email: true, push: true, inApp: true },
  weeklyDigest: { email: true, push: false, inApp: false },
};

const notificationEvents = [
  {
    key: "taskAssigned",
    label: "Task Assigned",
    description: "When a task is assigned to you",
    icon: Users,
    defaultEnabled: true,
  },
  {
    key: "taskDueSoon",
    label: "Task Due Soon",
    description: "24 hours before a task is due",
    icon: Clock,
    defaultEnabled: true,
  },
  {
    key: "taskOverdue",
    label: "Task Overdue",
    description: "When a task becomes overdue",
    icon: AlertTriangle,
    defaultEnabled: true,
  },
  {
    key: "taskCompleted",
    label: "Task Completed",
    description: "When a task you created is completed",
    icon: CheckCircle2,
    defaultEnabled: false,
  },
  {
    key: "taskMentioned",
    label: "Mentioned in Task",
    description: "When you're mentioned in a task or comment",
    icon: MessageSquare,
    defaultEnabled: true,
  },
  {
    key: "taskCommented",
    label: "Task Comment",
    description: "When someone comments on your task",
    icon: MessageSquare,
    defaultEnabled: true,
  },
  {
    key: "fileAttached",
    label: "File Attached",
    description: "When a file is attached to your task",
    icon: FileText,
    defaultEnabled: false,
  },
  {
    key: "dependencyResolved",
    label: "Dependency Resolved",
    description: "When a blocking task is completed",
    icon: CheckCircle2,
    defaultEnabled: true,
  },
  {
    key: "milestoneReached",
    label: "Milestone Reached",
    description: "When a project milestone is achieved",
    icon: CheckCircle2,
    defaultEnabled: true,
  },
  {
    key: "weeklyDigest",
    label: "Weekly Digest",
    description: "Weekly summary of your tasks and activity",
    icon: Mail,
    defaultEnabled: true,
  },
];

interface TaskNotificationSettingsProps {
  userId?: number;
}

export function TaskNotificationSettings({ userId }: TaskNotificationSettingsProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing preferences
  const { isLoading } = useQuery({
    queryKey: ["/api/users", userId, "notification-preferences"],
    queryFn: async () => {
      if (!userId) return defaultPreferences;
      const res = await apiRequest("GET", `/api/users/${userId}/notification-preferences`);
      return res.json();
    },
    onSuccess: (data: NotificationPreferences) => {
      setPreferences(data);
    },
  });

  // Save preferences mutation
  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      if (!userId) return;
      return apiRequest("PATCH", `/api/users/${userId}/notification-preferences`, prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notification-preferences"] });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (
    eventKey: keyof NotificationPreferences,
    channel: keyof NotificationChannel
  ) => {
    setPreferences(prev => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        [channel]: !prev[eventKey][channel],
      },
    }));
    setHasChanges(true);
  };

  const handleEnableAll = () => {
    const allEnabled: NotificationPreferences = {
      taskAssigned: { email: true, push: true, inApp: true },
      taskDueSoon: { email: true, push: true, inApp: true },
      taskOverdue: { email: true, push: true, inApp: true },
      taskCompleted: { email: true, push: true, inApp: true },
      taskMentioned: { email: true, push: true, inApp: true },
      taskCommented: { email: true, push: true, inApp: true },
      fileAttached: { email: true, push: true, inApp: true },
      dependencyResolved: { email: true, push: true, inApp: true },
      milestoneReached: { email: true, push: true, inApp: true },
      weeklyDigest: { email: true, push: true, inApp: true },
    };
    setPreferences(allEnabled);
    setHasChanges(true);
  };

  const handleDisableAll = () => {
    const allDisabled: NotificationPreferences = {
      taskAssigned: { email: false, push: false, inApp: false },
      taskDueSoon: { email: false, push: false, inApp: false },
      taskOverdue: { email: false, push: false, inApp: false },
      taskCompleted: { email: false, push: false, inApp: false },
      taskMentioned: { email: false, push: false, inApp: false },
      taskCommented: { email: false, push: false, inApp: false },
      fileAttached: { email: false, push: false, inApp: false },
      dependencyResolved: { email: false, push: false, inApp: false },
      milestoneReached: { email: false, push: false, inApp: false },
      weeklyDigest: { email: false, push: false, inApp: false },
    };
    setPreferences(allDisabled);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Task Notifications
            </CardTitle>
            <CardDescription>
              Configure how you want to be notified about task events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEnableAll}>
              <Volume2 className="h-4 w-4 mr-1" />
              Enable All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisableAll}>
              <VolumeX className="h-4 w-4 mr-1" />
              Disable All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Channel Legend */}
        <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone className="h-4 w-4" />
            <span>Push</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Monitor className="h-4 w-4" />
            <span>In-App</span>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Notification Events */}
        <div className="space-y-4">
          {notificationEvents.map(event => {
            const Icon = event.icon;
            const eventPrefs = preferences[event.key as keyof NotificationPreferences];

            return (
              <div
                key={event.key}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="font-medium">{event.label}</Label>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={eventPrefs?.email ?? false}
                      onCheckedChange={() =>
                        handleToggle(event.key as keyof NotificationPreferences, "email")
                      }
                    />
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Push */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={eventPrefs?.push ?? false}
                      onCheckedChange={() =>
                        handleToggle(event.key as keyof NotificationPreferences, "push")
                      }
                    />
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* In-App */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={eventPrefs?.inApp ?? false}
                      onCheckedChange={() =>
                        handleToggle(event.key as keyof NotificationPreferences, "inApp")
                      }
                    />
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreferences(defaultPreferences);
                setHasChanges(false);
              }}
            >
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TaskNotificationSettings;
