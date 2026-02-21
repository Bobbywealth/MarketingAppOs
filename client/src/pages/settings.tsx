import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Bell, Shield, Database, RefreshCw, Smartphone, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SimpleUploader } from "@/components/SimpleUploader";
import { ApiKeysPanel } from "@/components/settings/ApiKeysPanel";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    username: user?.username || "",
    profileImageUrl: (user as any)?.profileImageUrl || "",
  });

  // Keep local form state in sync when user loads/changes
  useEffect(() => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
      profileImageUrl: (user as any)?.profileImageUrl || "",
    });
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification preferences state and queries
  const { data: notificationPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ["/api/user/notification-preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/notification-preferences");
      return response.json();
    },
  });

  const [localPrefs, setLocalPrefs] = useState({
    emailNotifications: true,
    taskUpdates: true,
    clientMessages: true,
    dueDateReminders: true,
    projectUpdates: true,
    systemAlerts: true,
  });

  // Update local state when data loads
  useEffect(() => {
    if (notificationPrefs) {
      setLocalPrefs(notificationPrefs);
    }
  }, [notificationPrefs]);

  const saveNotificationPreferencesMutation = useMutation({
    mutationFn: async (preferences: typeof localPrefs) => {
      const response = await apiRequest("PUT", "/api/user/notification-preferences", preferences);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save notification preferences");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Preferences saved",
        description: "Your notification preferences have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/notification-preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // PWA Update functions
  const clearPWACache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: 'CLEAR_CACHE' });
        
        toast({
          title: "🧹 Cache Cleared",
          description: "PWA cache has been cleared. Reloading app...",
        });
        
        // Wait a moment then reload
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  const forceAppUpdate = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Unregister and re-register to get fresh service worker
          await registration.unregister();
          
          toast({
            title: "🔄 Updating App",
            description: "Fetching latest version...",
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update app",
        variant: "destructive",
      });
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const response = await apiRequest("POST", "/api/user/change-password", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Password changed",
        description: "Your password has been changed successfully.",
      });
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  const runMigrationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/run-migration", {});
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Migration Complete!",
        description: data.message || "Database columns added successfully. Please refresh the page.",
      });
      // Refresh after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Migration Failed",
        description: error?.message || "Failed to run database migration.",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!profileData.username.trim()) {
      toast({
        title: "Error",
        description: "Username is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (profileData.username.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate(passwordData);
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex gap-2 overflow-x-auto whitespace-nowrap -mx-2 px-2">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="app">
            <Smartphone className="w-4 h-4 mr-2" />
            App
          </TabsTrigger>
          {user?.role === "admin" && (
            <>
              <TabsTrigger value="system">
                <Database className="w-4 h-4 mr-2" />
                System
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="api-keys">
                <KeyRound className="w-4 h-4 mr-2" />
                API Keys
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how others see you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
                      {profileData.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profileData.profileImageUrl}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No photo</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <SimpleUploader
                        accept="image/*"
                        maxSizeMB={10}
                        buttonText={profileData.profileImageUrl ? "Change Photo" : "Upload Photo"}
                        onUploadComplete={(url) => {
                          setProfileData((prev) => ({ ...prev, profileImageUrl: url }));
                          toast({ title: "✅ Photo uploaded", description: "Click Save Changes to apply it." });
                        }}
                      />
                      {profileData.profileImageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setProfileData((prev) => ({ ...prev, profileImageUrl: "" }))}
                        >
                          Remove photo
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a square image for best results.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, lastName: e.target.value })
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a unique username for your account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user?.role} disabled className="capitalize" />
                </div>

                <Separator />

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password *</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Re-enter new password"
                    minLength={6}
                    required
                  />
                </div>

                <Separator />

                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefsLoading ? (
                <div className="text-center py-4">Loading preferences...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch 
                      checked={localPrefs.emailNotifications}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Task Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when tasks are assigned to you
                      </p>
                    </div>
                    <Switch 
                      checked={localPrefs.taskUpdates}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, taskUpdates: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Client Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for new client messages
                      </p>
                    </div>
                    <Switch 
                      checked={localPrefs.clientMessages}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, clientMessages: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Due Date Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming deadlines
                      </p>
                    </div>
                    <Switch 
                      checked={localPrefs.dueDateReminders}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, dueDateReminders: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Project Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about project milestones and changes
                      </p>
                    </div>
                    <Switch 
                      checked={localPrefs.projectUpdates}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, projectUpdates: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about system updates and security
                      </p>
                    </div>
                    <Switch 
                      checked={localPrefs.systemAlerts}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, systemAlerts: checked }))}
                    />
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => saveNotificationPreferencesMutation.mutate(localPrefs)}
                      disabled={saveNotificationPreferencesMutation.isPending}
                      className="w-full"
                    >
                      {saveNotificationPreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Settings */}
        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App & PWA Settings</CardTitle>
              <CardDescription>
                Manage your Progressive Web App settings and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Clear App Cache</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If the app isn't showing recent changes, clear the cache to get the latest version. The app will reload automatically.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={clearPWACache}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Cache & Reload
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Force App Update</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Completely refresh the app to get the absolute latest version. This will unregister and re-download the service worker.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={forceAppUpdate}
                    className="w-full sm:w-auto"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Force Update
                  </Button>
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">💡 Tip</h4>
                  <p className="text-sm text-muted-foreground">
                    The PWA (Progressive Web App) caches content for offline use. If you notice the app isn't showing recent changes from the desktop version, use "Clear Cache & Reload" to sync with the latest updates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings (Admin Only) */}
        {user?.role === "admin" && (
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure system-wide settings (Admin only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" placeholder="Your Company Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input id="companyEmail" type="email" placeholder="contact@company.com" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable access for non-admin users
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register accounts
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database</CardTitle>
                <CardDescription>Database connection and backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-sm text-muted-foreground">Connected to PostgreSQL</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    ● Connected
                  </Badge>
                </div>
                
                <Separator />
                
                {/* Database Migration Section */}
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium text-orange-600 dark:text-orange-400">⚠️ Database Migration Required</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click below to add missing database columns (email, name fields, client ordering). This only needs to be run once.
                    </p>
                  </div>
                  <Button 
                    onClick={() => runMigrationMutation.mutate()}
                    disabled={runMigrationMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {runMigrationMutation.isPending ? (
                      <>Running Migration...</>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Run Database Migration
                      </>
                    )}
                  </Button>
                </div>
                
                <Separator />
                
                <Button variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Security Settings (Admin Only) */}
        {user?.role === "admin" && (
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage security and access control settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out inactive users after
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Active Sessions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Current Session</p>
                        <p className="text-xs text-muted-foreground">Last active: Just now</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {user?.role === "admin" && (
          <TabsContent value="api-keys" className="space-y-6">
            <ApiKeysPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
    </div>
  );
}
