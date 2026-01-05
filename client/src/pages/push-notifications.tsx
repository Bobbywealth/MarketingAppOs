import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, UserCheck, Globe, History, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface PushNotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  url: string | null;
  targetType: string;
  targetValue: string | null;
  sentBy: number | null;
  recipientCount: number;
  successful: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export default function PushNotifications() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe, forceResubscribe } = usePushNotifications({ enabled: !!user });

  // Emergency cleanup mutation
  const emergencyCleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/push/emergency-cleanup");
      if (!response.ok) {
        throw new Error("Failed to cleanup subscriptions");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🚨 Emergency Cleanup Complete",
        description: `Deleted ${data.deletedSubscriptions} subscriptions. Please re-subscribe now.`,
      });
      // Force refresh the page to reset push notification state
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Could not cleanup subscriptions",
        variant: "destructive",
      });
    },
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [targetType, setTargetType] = useState<"user" | "role" | "broadcast">("broadcast");
  const [targetValue, setTargetValue] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch push notification history
  const { data: history, refetch: refetchHistory } = useQuery<PushNotificationHistoryItem[]>({
    queryKey: ["/api/push/history"],
  });

  const handleSend = async () => {
    if (!title || !body) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and body",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const payload: any = {
        title,
        body,
        url: url || undefined,
      };

      if (targetType === "broadcast") {
        payload.broadcast = true;
      } else if (targetType === "user") {
        payload.userId = parseInt(targetValue);
      } else if (targetType === "role") {
        payload.role = targetValue;
      }

      const response = await apiRequest("POST", "/api/push/send", payload);

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Sent!",
          description: `Push notification sent to ${data.recipientCount} recipient(s)`,
        });

        // Clear form
        setTitle("");
        setBody("");
        setUrl("");
        
        // Refresh history
        refetchHistory();
      } else {
        throw new Error("Failed to send");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send push notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-full gradient-mesh p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="w-8 h-8" />
              Push Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Send and manage push notifications' : 'Manage push notifications for this device'}
            </p>
          </div>
        </div>

        {/* Browser Support Alert */}
        {!isSupported && (
          <Alert>
            <AlertDescription>
              ⚠️ Push notifications are not supported in your browser. Try using Chrome, Firefox, or Edge.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Notifications</CardTitle>
            <CardDescription>
              Subscribe to receive push notifications on this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  {isSubscribed ? "✅ Subscribed" : "🔕 Not Subscribed"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed
                    ? "You'll receive notifications on this device"
                    : "Subscribe to receive push notifications"}
                </p>
                {!isSupported && (
                  <p className="text-xs text-red-500 mt-2">
                    ⚠️ Push notifications not supported on this device/browser. 
                    Make sure you're using the PWA from your home screen.
                  </p>
                )}
              </div>
              {isSupported ? (
                <div className="flex gap-2">
                  <Button
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={loading}
                    variant={isSubscribed ? "outline" : "default"}
                  >
                    {loading ? "Processing..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
                  </Button>
                  {isSubscribed && (
                    <div className="flex gap-2">
                      <Button
                        onClick={forceResubscribe}
                        disabled={loading || emergencyCleanupMutation.isPending}
                        variant="secondary"
                        size="sm"
                      >
                        Force Refresh
                      </Button>
                      <Button
                        onClick={() => emergencyCleanupMutation.mutate()}
                        disabled={loading || emergencyCleanupMutation.isPending}
                        variant="destructive"
                        size="sm"
                      >
                        🚨 Emergency Fix
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Debug info:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ServiceWorker: {'serviceWorker' in navigator ? '✅' : '❌'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PushManager: {'PushManager' in window ? '✅' : '❌'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send Notification Card (admins only) */}
        {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Compose Notification
            </CardTitle>
            <CardDescription>
              Send a push notification to users, roles, or everyone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                placeholder="Notification message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">Action URL (Optional)</Label>
              <Input
                id="url"
                placeholder="/tasks or https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {/* Target Type */}
            <div className="space-y-2">
              <Label>Send To</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  variant={targetType === "broadcast" ? "default" : "outline"}
                  onClick={() => setTargetType("broadcast")}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Everyone
                </Button>
                <Button
                  variant={targetType === "role" ? "default" : "outline"}
                  onClick={() => setTargetType("role")}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  By Role
                </Button>
                <Button
                  variant={targetType === "user" ? "default" : "outline"}
                  onClick={() => setTargetType("user")}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Specific User
                </Button>
              </div>
            </div>

            {/* Target Value */}
            {targetType === "role" && (
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={targetValue} onValueChange={setTargetValue}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="manager">Managers</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetType === "user" && (
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="number"
                  placeholder="Enter user ID"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={sending || !title || !body}
              className="w-full"
              size="lg"
            >
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Quick Send Templates (admins only) */}
        {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Templates</CardTitle>
            <CardDescription>Common notification templates for quick sending</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setTitle("🎉 New Feature Available!");
                setBody("Check out the latest updates to the platform");
                setTargetType("broadcast");
              }}
            >
              New Feature
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle("⚠️ Urgent: Action Required");
                setBody("Please review and complete your pending tasks");
                setTargetType("role");
                setTargetValue("admin");
              }}
            >
              Urgent Alert
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle("📅 Reminder: Meeting Today");
                setBody("Don't forget about today's team meeting at 2 PM");
                setTargetType("broadcast");
              }}
            >
              Meeting Reminder
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle("✅ Task Completed");
                setBody("A task assigned to you has been completed");
                setTargetType("role");
                setTargetValue("manager");
              }}
            >
              Task Update
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Notification History (admins only) */}
        {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Notification History
            </CardTitle>
            <CardDescription>
              View all sent push notifications and their delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No push notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      item.successful
                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                        : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {item.successful ? (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                          <h4 className="font-semibold">{item.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.body}</p>
                        {item.url && (
                          <p className="text-xs text-muted-foreground">
                            🔗 Action URL: {item.url}
                          </p>
                        )}
                        {!item.successful && item.errorMessage && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            ❌ Error: {item.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <div className="flex items-center gap-2">
                          {item.targetType === "broadcast" && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Broadcast
                            </Badge>
                          )}
                          {item.targetType === "role" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {item.targetValue}
                            </Badge>
                          )}
                          {item.targetType === "user" && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              User #{item.targetValue}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </div>
                        {item.successful && (
                          <div className="text-xs font-medium text-green-600 dark:text-green-400">
                            {item.recipientCount} recipient{item.recipientCount !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}

