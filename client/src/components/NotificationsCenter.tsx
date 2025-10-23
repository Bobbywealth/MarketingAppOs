import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2, X, AlertCircle, CheckCircle2, Info, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // info, success, warning, error
  category: string; // task, payment, deadline, login, general
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export function NotificationsCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== 'false'; // default to true
  });
  const queryClient = useQueryClient();
  const previousCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Create notification sound using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant two-tone notification sound (like iOS)
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Louder volume with smooth envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.02); // Quick attack
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.05); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Fade out
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Two-tone notification: higher pitch then lower pitch (like iOS/Android)
      const now = audioContext.currentTime;
      playTone(1000, now, 0.15); // First tone (higher)
      playTone(800, now + 0.15, 0.15); // Second tone (lower)
      
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  // Toggle sound preference
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', String(newValue));
    
    // Play test sound when enabling
    if (newValue) {
      playNotificationSound();
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const createTestNotificationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/test");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      playNotificationSound();
    },
  });

  const checkTasksMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/check-tasks", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Check for new notifications and play sound
  useEffect(() => {
    const currentUnreadCount = unreadCount;
    
    // Only play sound if count increased (new notification arrived)
    if (previousCountRef.current > 0 && currentUnreadCount > previousCountRef.current) {
      playNotificationSound();
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        const latestNotification = notifications.find(n => !n.isRead);
        if (latestNotification) {
          new Notification(latestNotification.title, {
            body: latestNotification.message,
            icon: '/favicon.ico',
            tag: latestNotification.id,
          });
        }
      }
    }
    
    previousCountRef.current = currentUnreadCount;
  }, [unreadCount, notifications]);

  // Periodically check for due/overdue tasks
  useEffect(() => {
    // Check immediately on mount
    checkTasksMutation.mutate();
    
    // Then check every 5 minutes
    const interval = setInterval(() => {
      checkTasksMutation.mutate();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              title={soundEnabled ? "Mute notifications" : "Enable notification sounds"}
              className={soundEnabled ? "text-primary" : "text-muted-foreground"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you when something important happens
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => createTestNotificationMutation.mutate()}
                disabled={createTestNotificationMutation.isPending}
                className="mt-4"
              >
                {createTestNotificationMutation.isPending ? "Creating..." : "Create Test Notification"}
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-8">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Mark as read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      disabled={deleteNotificationMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <>
          <Separator />
          <div className="p-2 space-y-1">
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => createTestNotificationMutation.mutate()}
              disabled={createTestNotificationMutation.isPending}
            >
              {createTestNotificationMutation.isPending ? "Creating..." : "🧪 Test Notification"}
            </Button>
          </div>
        </>
      </PopoverContent>
    </Popover>
  );
}

