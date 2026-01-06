import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { getDefaultDashboardPath } from "@/lib/effective-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/PullToRefresh";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ListTodo, Activity, Clock, Ticket } from "lucide-react";
import { Celebration } from "@/components/Celebration";

type StaffStats = {
  taskMetrics?: { total: number; completed: number; completionPercentage: number };
  todayTaskMetrics?: { total: number; completed: number };
  unreadMessagesCount?: number;
  deadLinesThisWeek?: number;
  upcomingDeadlines?: Array<{ title: string; date: string; urgent: boolean }>;
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { role, isStaff } = usePermissions();

  useEffect(() => {
    if (!isStaff) setLocation(getDefaultDashboardPath(role));
  }, [isStaff, role, setLocation]);

  const { data: stats, isLoading, refetch } = useQuery<StaffStats>({
    queryKey: ["/api/dashboard/staff-stats"],
    refetchInterval: 30000,
    retry: 3,
  });

  const myTasks = stats?.taskMetrics?.total ?? 0;
  const completion = stats?.taskMetrics?.completionPercentage ?? 0;
  const unread = stats?.unreadMessagesCount ?? 0;
  const deadlines = stats?.deadLinesThisWeek ?? 0;

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <Celebration active={completion === 100 && myTasks > 0} />
      <div className="min-h-full gradient-mesh">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s your personal workload snapshot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <ListTodo className="w-4 h-4" /> My Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold font-mono">
                  <NumberTicker value={myTasks} />
                </div>
                <Button size="sm" variant="secondary" onClick={() => setLocation("/tasks")}>
                  Open tasks
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Unread Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold font-mono">
                  <NumberTicker value={unread} />
                </div>
                <Button size="sm" variant="secondary" onClick={() => setLocation("/messages")}>
                  Go to messages
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Deadlines (7d)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold font-mono">
                  <NumberTicker value={deadlines} />
                </div>
                <Button size="sm" variant="secondary" onClick={() => setLocation("/company-calendar")}>
                  View calendar
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold font-mono">{completion}%</div>
                <p className="text-xs text-muted-foreground">Task completion</p>
                <Button size="sm" variant="secondary" onClick={() => setLocation("/tickets")}>
                  View tickets
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (stats?.upcomingDeadlines?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {(stats?.upcomingDeadlines ?? []).slice(0, 5).map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{d.title}</div>
                        <div className="text-xs text-muted-foreground">{d.date}</div>
                      </div>
                      {d.urgent && (
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Urgent
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No upcoming deadlines.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PullToRefresh>
  );
}


