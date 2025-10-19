import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, FileText, MessageSquare, AlertCircle, CheckCircle2, Clock } from "lucide-react";
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
      </div>
    </div>
  );
}

