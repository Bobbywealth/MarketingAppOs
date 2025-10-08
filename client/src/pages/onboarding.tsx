import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
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
      <div className="p-8">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">Client Onboarding</h1>
        <p className="text-muted-foreground">Track 30-day onboarding progress for new clients</p>
      </div>

      {onboardingClients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No clients currently in onboarding
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {onboardingClients.map((client) => {
            const tasks = getClientTasks(client.id);
            const progress = getProgress(client.id);

            return (
              <Card key={client.id} data-testid={`card-onboarding-${client.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-xl">{client.name}</CardTitle>
                    <Badge variant="secondary" className="bg-chart-1/10 text-chart-1">
                      Day {tasks[0]?.dueDay || 1} of 30
                    </Badge>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Onboarding Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
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
  );
}
