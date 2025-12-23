import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  Globe,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Instagram,
  Facebook,
  Linkedin,
  Users,
  BarChart3,
  FileText,
  CreditCard,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSalesAgent = (user as any)?.role === "sales_agent";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const clientId = params?.id;

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery<any>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Fetch tasks for this client
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    select: (data) => data.filter((task: any) => task.clientId === clientId),
  });

  // Fetch content posts for this client
  const { data: contentPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/content-posts"],
    select: (data) => data.filter((post: any) => post.clientId === clientId),
  });

  // Fetch social stats for this client
  const { data: socialStats = [] } = useQuery<any[]>({
    queryKey: [`/api/clients/${clientId}/social-stats`],
    enabled: !!clientId,
  });

  // Fetch invoices for this client
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    select: (data) => data.filter((invoice: any) => invoice.clientId === clientId),
  });

  // Fetch campaigns for this client
  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/campaigns"],
    select: (data) => data.filter((campaign: any) => campaign.clientId === clientId),
  });

  // Fetch creator assignments for this client (internal only)
  const { data: creatorAssignments = [] } = useQuery<any[]>({
    queryKey: [`/api/clients/${clientId}/creators`],
    enabled: !!clientId && !isSalesAgent,
  });

  // Fetch visits for this client (internal only)
  const { data: visits = [] } = useQuery<any[]>({
    queryKey: [clientId ? `/api/visits?clientId=${clientId}` : ""],
    enabled: !!clientId && !isSalesAgent,
  });

  const { data: allCreators = [] } = useQuery<any[]>({
    queryKey: ["/api/creators"],
    enabled: !!clientId && !isSalesAgent,
  });

  const assignCreatorMutation = useMutation({
    mutationFn: async ({ creatorId, role }: { creatorId: string; role: "primary" | "backup" }) => {
      const res = await fetch(`/api/clients/${clientId}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ creatorId, role }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to assign creator");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/creators`] });
      toast({ title: "Creator assignment updated" });
    },
    onError: (e: any) => toast({ title: "Assignment failed", description: e?.message, variant: "destructive" }),
  });

  if (clientLoading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg mb-4">Client not found</p>
            <Button onClick={() => setLocation("/clients")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCall = () => {
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
      toast({ title: "📞 Calling...", description: client.phone });
    }
  };

  const handleSMS = () => {
    setLocation(`/phone?sms=${encodeURIComponent(client.phone || "")}`);
  };

  const handleEmail = () => {
    if (client.email) {
      window.location.href = `mailto:${client.email}`;
    }
  };

  // Calculate stats
  const activeTasks = tasks.filter((t: any) => t.status !== "completed").length;
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const totalRevenue = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + parseFloat(i.totalAmount || 0), 0);
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending").length;

  // Get primary social platform
  const primarySocial = socialStats.find((s: any) => s.platform === "instagram") || socialStats[0];

  const nextVisit = visits
    .filter((v: any) => new Date(v.scheduledStart) > new Date() && v.status !== "cancelled")
    .sort((a: any, b: any) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0];
  const lastVisit = visits
    .filter((v: any) => new Date(v.scheduledStart) <= new Date())
    .sort((a: any, b: any) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())[0];

  const primaryCreator = creatorAssignments.find((a: any) => a.role === "primary");
  const backupCreator = creatorAssignments.find((a: any) => a.role === "backup");

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, any> = {
      instagram: Instagram,
      facebook: Facebook,
      linkedin: Linkedin,
    };
    return icons[platform?.toLowerCase()] || Users;
  };

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/clients")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Button>
        </div>

        {/* Client Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-purple-600 text-white">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>

              {/* Client Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold">{client.name}</h1>
                  <Badge variant={client.status === "active" ? "default" : "secondary"}>
                    {client.status || "Active"}
                  </Badge>
                </div>
                {client.company && (
                  <p className="text-lg text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {client.company}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {client.email && (
                    <button
                      onClick={handleEmail}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {client.email}
                    </button>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <Button onClick={handleCall} disabled={!client.phone} className="gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Button onClick={handleSMS} disabled={!client.phone} variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </Button>
                <Button onClick={handleEmail} disabled={!client.email} variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold">{activeTasks}</p>
                  <p className="text-xs text-muted-foreground">{completedTasks} completed</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Social Followers</p>
                  <p className="text-2xl font-bold">
                    {primarySocial?.followers ? primarySocial.followers.toLocaleString() : "—"}
                  </p>
                  {primarySocial?.growthRate && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {primarySocial.growthRate}%
                    </p>
                  )}
                </div>
                {primarySocial && React.createElement(getPlatformIcon(primarySocial.platform), {
                  className: "w-8 h-8 text-purple-500",
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                  {pendingInvoices > 0 && (
                    <p className="text-xs text-orange-600">{pendingInvoices} pending invoices</p>
                  )}
                </div>
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fulfillment Snapshot (not visible to sales agents) */}
        {!isSalesAgent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Creators</div>
                <div className="text-sm">Primary: {primaryCreator?.creatorName || "—"}</div>
                <div className="text-sm">Backup: {backupCreator?.creatorName || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Next Visit</div>
                <div className="text-sm">
                  {nextVisit ? `${new Date(nextVisit.scheduledStart).toLocaleString()} • ${nextVisit.creatorName || "Creator"}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Visit</div>
                <div className="text-sm">
                  {lastVisit ? `${new Date(lastVisit.scheduledStart).toLocaleString()} • ${lastVisit.status}` : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isSalesAgent ? "grid-cols-5" : "grid-cols-6"}`}>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            {!isSalesAgent && (
              <TabsTrigger value="visits" className="gap-2">
                <Calendar className="w-4 h-4" />
                Visits
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 ${task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.status === 'completed' ? 'Completed' : 'In progress'}
                          {task.dueDate && ` • Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contentPosts
                    .filter((post: any) => new Date(post.scheduledFor) > new Date())
                    .slice(0, 5)
                    .map((post: any) => (
                      <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{post.title || "Untitled Post"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{post.platforms?.join(", ")}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.scheduledFor), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <Badge variant={post.approvalStatus === "approved" ? "default" : "secondary"}>
                          {post.approvalStatus}
                        </Badge>
                      </div>
                    ))}
                  {contentPosts.filter((post: any) => new Date(post.scheduledFor) > new Date()).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming content</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Social Media Overview */}
            {socialStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Social Media Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {socialStats.map((stat: any) => {
                      const Icon = getPlatformIcon(stat.platform);
                      return (
                        <div key={stat.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium capitalize">{stat.platform}</span>
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-2 text-sm">
                            {stat.followers && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Followers</span>
                                <span className="font-medium">{stat.followers.toLocaleString()}</span>
                              </div>
                            )}
                            {stat.engagement && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Engagement</span>
                                <span className="font-medium">{stat.engagement}%</span>
                              </div>
                            )}
                            {stat.growthRate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Growth</span>
                                <span className={`font-medium ${parseFloat(stat.growthRate) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {stat.growthRate}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className={`w-5 h-5 ${task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.status === 'completed' ? 'Completed' : task.status}
                              {task.dueDate && ` • Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No tasks for this client</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                {contentPosts.length > 0 ? (
                  <div className="space-y-3">
                    {contentPosts.map((post: any) => (
                      <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex-1">
                          <p className="font-medium">{post.title || "Untitled Post"}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{post.platforms?.join(", ")}</span>
                            <span>•</span>
                            <span>{new Date(post.scheduledFor).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant={post.approvalStatus === "approved" ? "default" : "secondary"}>
                          {post.approvalStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No content posts for this client</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Social Media Analytics</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/social?clientId=${clientId}`)}
                  >
                    View Full Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {socialStats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socialStats.map((stat: any) => {
                      const Icon = getPlatformIcon(stat.platform);
                      return (
                        <div key={stat.id} className="p-6 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 mb-4">
                            <Icon className="w-6 h-6" />
                            <h3 className="text-lg font-semibold capitalize">{stat.platform}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {stat.followers && (
                              <div>
                                <p className="text-sm text-muted-foreground">Followers</p>
                                <p className="text-2xl font-bold">{stat.followers.toLocaleString()}</p>
                              </div>
                            )}
                            {stat.posts && (
                              <div>
                                <p className="text-sm text-muted-foreground">Posts</p>
                                <p className="text-2xl font-bold">{stat.posts}</p>
                              </div>
                            )}
                            {stat.engagement && (
                              <div>
                                <p className="text-sm text-muted-foreground">Engagement</p>
                                <p className="text-2xl font-bold">{stat.engagement}%</p>
                              </div>
                            )}
                            {stat.growthRate && (
                              <div>
                                <p className="text-sm text-muted-foreground">Growth</p>
                                <p className={`text-2xl font-bold ${parseFloat(stat.growthRate) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {stat.growthRate > 0 ? '+' : ''}{stat.growthRate}%
                                </p>
                              </div>
                            )}
                          </div>
                          {stat.lastUpdated && (
                            <p className="text-xs text-muted-foreground mt-4">
                              Updated {formatDistanceToNow(new Date(stat.lastUpdated), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No social media stats yet. Add stats from the{" "}
                    <button
                      onClick={() => setLocation("/admin/social-stats")}
                      className="text-primary hover:underline"
                    >
                      Social Stats page
                    </button>
                    .
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Invoices & Billing</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${parseFloat(invoice.totalAmount).toLocaleString()}</p>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No invoices for this client</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visits Tab (not visible to sales agents) */}
          {!isSalesAgent && (
            <TabsContent value="visits">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Visits</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/visits?clientId=${clientId}`)}>
                    View in Visits
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Primary Creator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">Current: {primaryCreator?.creatorName || "—"}</div>
                      {["admin", "manager"].includes((user as any)?.role) && (
                        <Select
                          value={primaryCreator?.creatorId || "none"}
                          onValueChange={(v) => v !== "none" && assignCreatorMutation.mutate({ creatorId: v, role: "primary" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Assign primary" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {allCreators
                              .filter((c: any) => c.status !== "inactive")
                              .map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.fullName} ({c.status})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Backup Creator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">Current: {backupCreator?.creatorName || "—"}</div>
                      {["admin", "manager"].includes((user as any)?.role) && (
                        <Select
                          value={backupCreator?.creatorId || "none"}
                          onValueChange={(v) => v !== "none" && assignCreatorMutation.mutate({ creatorId: v, role: "backup" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Assign backup" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {allCreators
                              .filter((c: any) => c.status !== "inactive")
                              .map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.fullName} ({c.status})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {visits.length > 0 ? (
                  visits
                    .sort((a: any, b: any) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())
                    .slice(0, 25)
                    .map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div>
                          <p className="font-medium">
                            {new Date(v.scheduledStart).toLocaleString()} • {v.creatorName || "Creator"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {v.status} • Upload: {v.uploadReceived ? "received" : v.uploadOverdue ? "overdue" : "missing"} • Approved: {v.approved ? "yes" : "no"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={v.uploadOverdue ? "destructive" : "secondary"}>{v.uploadOverdue ? "Upload Overdue" : v.status}</Badge>
                          <Button variant="outline" size="sm" onClick={() => setLocation(`/visits/${v.id}`)}>
                            Open
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No visits for this client</p>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

