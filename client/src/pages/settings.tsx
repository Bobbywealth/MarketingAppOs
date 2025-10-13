import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  Save 
} from "lucide-react";

const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Invalid email address"),
  companyPhone: z.string().optional(),
  companyWebsite: z.string().url("Invalid URL").or(z.literal("")),
  timezone: z.string(),
  dateFormat: z.string(),
});

type GeneralSettings = z.infer<typeof generalSettingsSchema>;

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  newClientNotification: z.boolean(),
  taskAssignmentNotification: z.boolean(),
  invoiceNotification: z.boolean(),
  ticketNotification: z.boolean(),
  dailyDigest: z.boolean(),
  weeklyReport: z.boolean(),
});

type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "Marketing Team App",
      companyEmail: "info@marketingteam.app",
      companyPhone: "+1 (555) 123-4567",
      companyWebsite: "https://marketingteam.app",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
    },
  });

  const notificationForm = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      newClientNotification: true,
      taskAssignmentNotification: true,
      invoiceNotification: true,
      ticketNotification: true,
      dailyDigest: false,
      weeklyReport: true,
    },
  });

  const saveGeneralSettings = useMutation({
    mutationFn: async (data: GeneralSettings) => {
      const response = await apiRequest("/api/settings/general", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveNotificationSettings = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      const response = await apiRequest("/api/settings/notifications", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Notification settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="general" className="gap-2" data-testid="tab-general">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2" data-testid="tab-appearance">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2" data-testid="tab-integrations">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">General Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure your company information and system preferences
                </p>
              </div>

              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit((data) => saveGeneralSettings.mutate(data))} className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Marketing Team App" {...field} data-testid="input-company-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@company.com" {...field} data-testid="input-company-email" />
                        </FormControl>
                        <FormDescription>
                          This email will be used for system notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-company-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://company.com" {...field} data-testid="input-company-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-timezone">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                              <SelectItem value="Europe/London">London (GMT)</SelectItem>
                              <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                              <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-date-format">
                                <SelectValue placeholder="Select date format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saveGeneralSettings.isPending}
                      className="gap-2"
                      data-testid="button-save-general"
                    >
                      <Save className="w-4 h-4" />
                      {saveGeneralSettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal information and account details
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="mt-2" data-testid="input-profile-email" />
                  <p className="text-sm text-muted-foreground mt-1">Your email cannot be changed</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>First Name</Label>
                    <Input placeholder="John" defaultValue={user?.firstName || ""} className="mt-2" data-testid="input-first-name" />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" defaultValue={user?.lastName || ""} className="mt-2" data-testid="input-last-name" />
                  </div>
                </div>

                <div>
                  <Label>Role</Label>
                  <Input value={user?.role || ""} disabled className="mt-2" data-testid="input-role" />
                  <p className="text-sm text-muted-foreground mt-1">Contact an administrator to change your role</p>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button className="gap-2" data-testid="button-save-profile">
                    <Save className="w-4 h-4" />
                    Save Profile
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Notification Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Manage how and when you receive notifications
                </p>
              </div>

              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit((data) => saveNotificationSettings.mutate(data))} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0 p-4 border rounded-lg">
                        <div className="space-y-1">
                          <FormLabel className="text-base font-semibold">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications for important events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-email-notifications"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Event Notifications</h3>

                    <FormField
                      control={notificationForm.control}
                      name="newClientNotification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel className="font-normal">New client added</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-new-client"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="taskAssignmentNotification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel className="font-normal">Task assigned to you</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-task-assignment"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="invoiceNotification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel className="font-normal">Invoice payment received</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-invoice"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="ticketNotification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel className="font-normal">New support ticket created</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-ticket"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Digest Reports</h3>

                    <FormField
                      control={notificationForm.control}
                      name="dailyDigest"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel className="font-normal">Daily digest email</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-daily-digest"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="weeklyReport"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <FormLabel className="font-normal">Weekly report email</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-weekly-report"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={saveNotificationSettings.isPending}
                      className="gap-2"
                      data-testid="button-save-notifications"
                    >
                      <Save className="w-4 h-4" />
                      {saveNotificationSettings.isPending ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Security Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your password and security preferences
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Current Password</Label>
                      <Input type="password" className="mt-2" data-testid="input-current-password" />
                    </div>
                    <div>
                      <Label>New Password</Label>
                      <Input type="password" className="mt-2" data-testid="input-new-password" />
                    </div>
                    <div>
                      <Label>Confirm New Password</Label>
                      <Input type="password" className="mt-2" data-testid="input-confirm-password" />
                    </div>
                    <Button data-testid="button-change-password">Update Password</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Two-factor authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch data-testid="switch-2fa" />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Last active: Just now</p>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Appearance</h2>
                <p className="text-sm text-muted-foreground">
                  Customize the look and feel of your dashboard
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Theme</Label>
                  <p className="text-sm text-muted-foreground mb-4">Select your preferred color scheme</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border-2 border-primary rounded-lg p-4 cursor-pointer">
                      <div className="bg-background h-20 rounded mb-2"></div>
                      <p className="text-sm font-medium text-center">Light</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer">
                      <div className="bg-black h-20 rounded mb-2"></div>
                      <p className="text-sm font-medium text-center">Dark</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer">
                      <div className="bg-gradient-to-br from-background to-black h-20 rounded mb-2"></div>
                      <p className="text-sm font-medium text-center">Auto</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold">Accent Color</Label>
                  <p className="text-sm text-muted-foreground mb-4">Choose your primary accent color</p>
                  <div className="flex gap-3">
                    {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-full border-2 border-transparent hover:border-foreground transition-colors"
                        style={{ backgroundColor: color }}
                        data-testid={`button-color-${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Integrations</h2>
                <p className="text-sm text-muted-foreground">
                  Connect third-party services to enhance your workflow
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Stripe</p>
                      <p className="text-sm text-muted-foreground">Payment processing</p>
                    </div>
                  </div>
                  <Button variant="outline" data-testid="button-stripe-connect">Connected</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Google Analytics</p>
                      <p className="text-sm text-muted-foreground">Website analytics</p>
                    </div>
                  </div>
                  <Button variant="outline" data-testid="button-analytics-connect">Connect</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Slack</p>
                      <p className="text-sm text-muted-foreground">Team communication</p>
                    </div>
                  </div>
                  <Button variant="outline" data-testid="button-slack-connect">Connect</Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
