import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, FileText, MessageSquare, AlertCircle, CheckCircle2, Clock, TrendingUp, Users, Heart, Eye, Share2, ThumbsUp, Video, Image as ImageIcon, DollarSign, Megaphone, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function ClientDashboard() {
  const { data: user } = useQuery({ queryKey: ["/api/user"] });
  
  // Fetch client-specific data
  const { data: stats } = useQuery({
    queryKey: ["/api/client-dashboard/stats"],
    enabled: !!user,
  });

  const { data: contentPosts = [] } = useQuery({
    queryKey: ["/api/content-posts"],
    enabled: !!user,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: !!user,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  const { data: secondMe } = useQuery({
    queryKey: ["/api/second-me"],
    enabled: !!user,
  });

  // Filter for upcoming content
  const upcomingContent = contentPosts
    .filter((post: any) => 
      post.scheduledFor && 
      new Date(post.scheduledFor) > new Date() &&
      (post.approvalStatus === 'approved' || post.approvalStatus === 'published')
    )
    .sort((a: any, b: any) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .slice(0, 5);

  // Filter for pending approval content
  const pendingApproval = contentPosts
    .filter((post: any) => post.approvalStatus === 'pending' || post.approvalStatus === 'draft')
    .slice(0, 3);

  // Filter for open tickets
  const openTickets = tickets.filter((ticket: any) => 
    ticket.status === 'open' || ticket.status === 'in_progress'
  );

  // Filter campaigns for this client
  const clientCampaigns = campaigns.filter((campaign: any) => 
    campaign.clientId === user?.clientId
  );

  // Filter invoices for this client
  const clientInvoices = invoices.filter((invoice: any) => 
    invoice.clientId === user?.clientId
  );

  // Calculate billing stats
  const totalPaid = clientInvoices
    .filter((invoice: any) => invoice.status === 'paid')
    .reduce((sum: number, invoice: any) => sum + invoice.amount, 0);

  const pendingAmount = clientInvoices
    .filter((invoice: any) => invoice.status === 'sent' || invoice.status === 'overdue')
    .reduce((sum: number, invoice: any) => sum + invoice.amount, 0);

  const metrics = [
    {
      title: "Scheduled Posts",
      value: upcomingContent.length,
      icon: Calendar,
      description: "Content scheduled for you",
      gradient: "from-blue-500 to-cyan-500",
      link: "/client-content",
    },
    {
      title: "Pending Approval",
      value: pendingApproval.length,
      icon: Clock,
      description: "Content awaiting review",
      gradient: "from-orange-500 to-yellow-500",
      link: "/client-content",
    },
    {
      title: "Open Tickets",
      value: openTickets.length,
      icon: MessageSquare,
      description: "Active support requests",
      gradient: "from-purple-500 to-pink-500",
      link: "/tickets",
    },
    {
      title: "Total Content",
      value: contentPosts.length,
      icon: FileText,
      description: "All content created for you",
      gradient: "from-green-500 to-teal-500",
      link: "/client-content",
    },
  ];

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">
            Welcome back{user?.username ? `, ${user.username}` : ''}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's an overview of your content and activity
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <Link key={metric.title} href={metric.link}>
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 card-hover-lift cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                
                <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold tracking-tight">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Social Media Overview */}
        <Card className="glass-strong border-0 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-blue-500/5"></div>
          <CardHeader className="relative border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Social Media Overview</CardTitle>
                  <CardDescription>Your social presence at a glance</CardDescription>
                </div>
              </div>
              <Link href="/client-analytics">
                <Button variant="outline" size="sm">
                  View Full Analytics →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Instagram */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold">Instagram</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Not Connected
                  </Badge>
                </div>
                <div className="space-y-2 pl-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Posts</span>
                    <span className="font-medium">0</span>
                  </div>
                  <Link href="/client-analytics">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      Connect Account
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Facebook */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <ThumbsUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold">Facebook</span>
                  <Badge className="ml-auto text-xs bg-green-500/20 text-green-700 border-green-500/30">
                    +8%
                  </Badge>
                </div>
                <div className="space-y-2 pl-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-medium">8,932</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reach</span>
                    <span className="font-medium">28,500</span>
                  </div>
                </div>
              </div>

              {/* TikTok */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold">TikTok</span>
                  <Badge className="ml-auto text-xs bg-green-500/20 text-green-700 border-green-500/30">
                    +23%
                  </Badge>
                </div>
                <div className="space-y-2 pl-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-medium">23,567</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-medium">6.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Views</span>
                    <span className="font-medium">125,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">32,499</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">23</div>
                  <div className="text-xs text-muted-foreground mt-1">Posts This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">5.2%</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">+12%</div>
                  <div className="text-xs text-muted-foreground mt-1">Growth Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Second Me Widget */}
        {secondMe ? (
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5"></div>
            <CardHeader className="relative border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Second Me - AI Avatar</CardTitle>
                    <CardDescription>Your AI digital twin status</CardDescription>
                  </div>
                </div>
                <Link href="/second-me">
                  <Button variant="outline" size="sm">
                    Manage →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative p-6">
              <div className="flex items-center gap-4">
                {secondMe.avatarUrl ? (
                  <img 
                    src={secondMe.avatarUrl} 
                    alt="AI Avatar" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Status:</h4>
                    <Badge className={
                      secondMe.status === 'active' ? 'bg-green-500/20 text-green-700' :
                      secondMe.status === 'ready' ? 'bg-green-500/20 text-green-700' :
                      secondMe.status === 'processing' ? 'bg-blue-500/20 text-blue-700' :
                      'bg-yellow-500/20 text-yellow-700'
                    }>
                      {secondMe.status === 'pending' && '⏳ Pending Payment'}
                      {secondMe.status === 'processing' && '🔄 Creating Avatar'}
                      {secondMe.status === 'ready' && '✅ Avatar Ready'}
                      {secondMe.status === 'active' && '🌟 Active'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Setup Fee</p>
                      <Badge variant={secondMe.setupPaid ? "default" : "outline"} className="mt-1 text-xs">
                        {secondMe.setupPaid ? '✓ Paid' : 'Pending'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weekly Content</p>
                      <Badge variant={secondMe.weeklySubscriptionActive ? "default" : "outline"} className="mt-1 text-xs">
                        {secondMe.weeklySubscriptionActive ? '✓ Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {secondMe.weeklySubscriptionActive && (
                    <p className="text-xs text-muted-foreground mt-3">
                      💰 $80/week • 4 AI-generated content pieces
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-strong border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5"></div>
            <CardHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create Your Second Me</CardTitle>
                  <CardDescription>Get an AI digital twin for content creation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload 15-20+ professional photos and we'll create your AI avatar. 
                  Then get weekly AI-generated content featuring you!
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-semibold mb-1">Setup Fee</p>
                    <p className="text-lg font-bold">Contact Us</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-semibold mb-1">Weekly Content</p>
                    <p className="text-lg font-bold">$80/week</p>
                  </div>
                </div>
                <Link href="/second-me">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Content */}
          <Card className="glass-strong border-0 shadow-xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Upcoming Content</CardTitle>
                    <CardDescription>Your scheduled posts</CardDescription>
                  </div>
                </div>
                <Link href="/client-content">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {upcomingContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No upcoming content scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingContent.map((post: any) => (
                    <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post.caption || "Untitled Post"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {post.platform}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.scheduledFor), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <Badge className={
                        post.approvalStatus === 'approved' ? 'bg-green-500/10 text-green-600' :
                        post.approvalStatus === 'published' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-gray-500/10 text-gray-600'
                      }>
                        {post.approvalStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="glass-strong border-0 shadow-xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Pending Approval</CardTitle>
                    <CardDescription>Content awaiting your review</CardDescription>
                  </div>
                </div>
                <Link href="/client-content">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {pendingApproval.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>All content has been reviewed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApproval.map((post: any) => (
                    <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post.caption || "Untitled Post"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {post.platform}
                          </Badge>
                          {post.scheduledFor && (
                            <span className="text-xs text-muted-foreground">
                              Scheduled: {new Date(post.scheduledFor).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                        {post.approvalStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Support Tickets */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Support Tickets</CardTitle>
                  <CardDescription>Your active support requests</CardDescription>
                </div>
              </div>
              <Link href="/tickets">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {openTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No open support tickets</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openTickets.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline" className={
                        ticket.priority === 'urgent' ? 'border-red-500 text-red-600' : ''
                      }>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Billing Summary</CardTitle>
                  <CardDescription>Your payment status and recent activity</CardDescription>
                </div>
              </div>
              <Link href="/client-billing">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">${(totalPaid / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">${(pendingAmount / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{clientInvoices.length}</p>
                <p className="text-sm text-muted-foreground">Invoices</p>
              </div>
            </div>
            
            {pendingAmount > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    You have ${(pendingAmount / 100).toLocaleString()} in pending payments
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Campaigns */}
        {clientCampaigns.length > 0 && (
          <Card className="glass-strong border-0 shadow-xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">My Campaigns</CardTitle>
                    <CardDescription>Your active marketing campaigns</CardDescription>
                  </div>
                </div>
                <Link href="/client-campaigns">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientCampaigns.slice(0, 3).map((campaign: any) => (
                  <div key={campaign.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium truncate">{campaign.name}</h4>
                      <Badge className={
                        campaign.status === 'active' ? 'bg-green-500/10 text-green-600' :
                        campaign.status === 'planning' ? 'bg-blue-500/10 text-blue-600' :
                        campaign.status === 'paused' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-gray-500/10 text-gray-600'
                      }>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize mb-2">{campaign.type} Campaign</p>
                    {campaign.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>
                    )}
                    {campaign.budget && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Budget: ${(campaign.budget / 100).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

