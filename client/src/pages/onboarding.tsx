import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Users, Plus } from "lucide-react";
import type { Client, OnboardingTask } from "@shared/schema";

export default function Onboarding() {
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: onboardingTasks, isLoading: tasksLoading } = useQuery<OnboardingTask[]>({
    queryKey: ["/api/onboarding-tasks"],
  });

  const onboardingClients = clients?.filter(client => client.status === "onboarding") || [];

  const getClientTasks = (clientId: string) => {
    return onboardingTasks?.filter(task => task.clientId === clientId) || [];
  };

  const getProgress = (clientId: string) => {
    const tasks = getClientTasks(clientId);
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  if (clientsLoading || tasksLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="h-6 bg-muted/50 rounded w-48 shimmer"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted/50 rounded shimmer"></div>
                    <div className="h-4 bg-muted/50 rounded w-3/4 shimmer"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 xl:p-12 space-y-4 md:space-y-6 lg:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Client Onboarding</h1>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Track 30-day onboarding progress for new clients</p>
          </div>
        </div>

        {onboardingClients.length === 0 ? (
          <Card className="border-dashed border-2 glass-strong">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-lg">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Active Onboarding</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                When clients are in their 30-day onboarding period, they'll appear here with their progress and tasks.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" data-testid="button-view-clients">
                  View All Clients
                </Button>
                <Button size="sm" data-testid="button-add-client">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-6">
          {onboardingClients.map((client) => {
            const tasks = getClientTasks(client.id);
            const progress = getProgress(client.id);

            return (
              <Card key={client.id} data-testid={`card-onboarding-${client.id}`} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover-lift gradient-border">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{client.name}</CardTitle>
                        {client.company && (
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      Day {tasks[0]?.dueDay || 1} of 30
                    </Badge>
                  </div>
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Onboarding Progress</span>
                      <span className="font-semibold text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover-elevate transition-colors"
                      data-testid={`task-${task.id}`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-chart-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Day {task.dueDay}</p>
                      </div>
                    </div>
                  ))}

                  {tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No onboarding tasks configured for this client
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
