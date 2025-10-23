import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, UserCheck, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PushNotifications() {
  const { toast } = useToast();
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [targetType, setTargetType] = useState<"user" | "role" | "broadcast">("broadcast");
  const [targetValue, setTargetValue] = useState("");
  const [sending, setSending] = useState(false);

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
        toast({
          title: "✅ Sent!",
          description: "Push notification sent successfully",
        });

        // Clear form
        setTitle("");
        setBody("");
        setUrl("");
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
    <div className="min-h-full gradient-mesh p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="w-8 h-8" />
              Push Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Send instant push notifications to your team
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
              </div>
              {isSupported && (
                <Button
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={loading}
                  variant={isSubscribed ? "outline" : "default"}
                >
                  {loading ? "Processing..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send Notification Card */}
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
                  className="flex items-center gap-2"}
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

        {/* Quick Send Templates */}
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
      </div>
    </div>
  );
}

