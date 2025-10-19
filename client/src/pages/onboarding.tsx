import { useState } from "react";
import { useQuery, useMutation } from "@tantml/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Users, Plus, Wand2, Trash2, Edit2, Sparkles, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, OnboardingTask } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Onboarding() {
  const { toast } = useToast();
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDay: 1,
    category: "setup",
  });

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

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("POST", `/api/onboarding-tasks/${taskId}/toggle`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Task updated", description: "Onboarding task status changed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const response = await apiRequest("POST", "/api/onboarding-tasks", task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-tasks"] });
      setIsAddTaskDialogOpen(false);
      setNewTask({ title: "", description: "", dueDay: 1, category: "setup" });
      setSelectedClient(null);
      toast({ title: "Task created", description: "New onboarding task added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest("POST", `/api/onboarding-tasks/default/${clientId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-tasks"] });
      toast({ title: "Template applied!", description: "Default onboarding tasks created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to apply template", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("DELETE", `/api/onboarding-tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-tasks"] });
      toast({ title: "Task deleted", description: "Onboarding task removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      toast({ title: "Error", description: "Please select a client", variant: "destructive" });
      return;
    }
    createTaskMutation.mutate({
      ...newTask,
      clientId: selectedClient,
    });
  };

  const getCategoryBadge = (category?: string) => {
    const colors: Record<string, string> = {
      setup: "bg-blue-500/10 text-blue-600",
      content: "bg-green-500/10 text-green-600",
      training: "bg-purple-500/10 text-purple-600",
      review: "bg-orange-500/10 text-orange-600",
    };
    return colors[category || "setup"] || colors.setup;
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
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Client Onboarding</h1>
            <p className="text-lg text-muted-foreground">Track 30-day onboarding progress for new clients</p>
          </div>
          <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Onboarding Task</DialogTitle>
                <DialogDescription>Create a custom onboarding task for a client</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={selectedClient || ""} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {onboardingClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g., Send welcome email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDay">Due Day (1-30) *</Label>
                    <Input
                      id="dueDay"
                      type="number"
                      min="1"
                      max="30"
                      value={newTask.dueDay}
                      onChange={(e) => setNewTask({ ...newTask, dueDay: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTask.category} onValueChange={(val) => setNewTask({ ...newTask, category: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="setup">Setup</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              <p className="text-sm text-muted-foreground mb-6">
                <strong>Tip:</strong> Set a client's status to "onboarding" when adding them to start tracking their onboarding journey.
              </p>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-6">
          {onboardingClients.map((client) => {
            const tasks = getClientTasks(client.id);
            const progress = getProgress(client.id);
            const hasNoTasks = tasks.length === 0;

            return (
              <Card key={client.id} data-testid={`card-onboarding-${client.id}`} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover-lift gradient-border">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{client.name}</CardTitle>
                        {client.company && (
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        <Calendar className="w-3 h-3 mr-1" />
                        Day {tasks[0]?.dueDay || 1} of 30
                      </Badge>
                      {hasNoTasks && (
                        <Button
                          size="sm"
                          onClick={() => applyTemplateMutation.mutate(client.id)}
                          disabled={applyTemplateMutation.isPending}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Apply Template
                        </Button>
                      )}
                    </div>
                  </div>
                  {!hasNoTasks && (
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Onboarding Progress</span>
                        <span className="font-semibold text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {hasNoTasks ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No onboarding tasks yet. Get started with our default template!
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => applyTemplateMutation.mutate(client.id)}
                        disabled={applyTemplateMutation.isPending}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {applyTemplateMutation.isPending ? "Applying..." : "Apply Default Template"}
                      </Button>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                        data-testid={`task-${task.id}`}
                      >
                        <button
                          onClick={() => toggleTaskMutation.mutate(task.id)}
                          className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                          disabled={toggleTaskMutation.isPending}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              Day {task.dueDay}
                            </Badge>
                            {task.category && (
                              <Badge variant="secondary" className={`text-xs px-2 py-0 ${getCategoryBadge(task.category)}`}>
                                {task.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
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
