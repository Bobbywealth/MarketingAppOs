import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, CheckCircle2, Clock, MessageSquare, Users } from "lucide-react";
import { requestNotificationPermission } from "@/lib/oneSignal";

export function NotificationPermissionPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if user has already been prompted or dismissed
    const hasBeenPrompted = localStorage.getItem('notificationPromptShown');
    const hasDismissed = localStorage.getItem('notificationPromptDismissed');
    
    // Check current notification permission
    const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    
    // Show prompt if:
    // 1. Never been prompted before
    // 2. Not dismissed
    // 3. Permission is still "default" (not granted or denied)
    if (!hasBeenPrompted && !hasDismissed && notificationPermission === 'default') {
      // Show after 2 seconds to not overwhelm user on login
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('notificationPromptShown', 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      await requestNotificationPermission();
      // Close the prompt after requesting
      setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="max-w-md w-full shadow-2xl border-2 animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-2xl">Enable Push Notifications</CardTitle>
              <CardDescription>Stay updated in real-time</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get instant alerts even when the app is closed:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">New Tasks</p>
                <p className="text-xs text-muted-foreground">When tasks are assigned to you</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Upcoming Deadlines</p>
                <p className="text-xs text-muted-foreground">Never miss an important deadline</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Client Messages</p>
                <p className="text-xs text-muted-foreground">Respond to clients instantly</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Team Updates</p>
                <p className="text-xs text-muted-foreground">Stay in sync with your team</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={handleEnable}
              disabled={isRequesting}
              className="w-full"
              size="lg"
            >
              {isRequesting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Requesting...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleDismiss}
              variant="ghost"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can change this anytime in Settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

