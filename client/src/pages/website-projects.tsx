import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Calendar, AlertTriangle, CheckCircle2, Clock, Shield, Server } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WebsiteProject, InsertWebsiteProject, Client } from "@shared/schema";
import { insertWebsiteProjectSchema } from "@shared/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const STAGES = [
  { id: "design", label: "Design", color: "bg-blue-500" },
  { id: "dev", label: "Development", color: "bg-purple-500" },
  { id: "qa", label: "QA Testing", color: "bg-amber-500" },
  { id: "launch", label: "Launched", color: "bg-emerald-500" },
];

const formSchema = insertWebsiteProjectSchema
  .omit({
    sslStatus: true,
    dnsStatus: true,
    dnsLastChecked: true,
  })
  .extend({
    hostingExpiry: z.string().optional(),
    sslExpiry: z.string().optional(),
    launchDate: z.string().optional(),
  });

type FormValues = z.infer<typeof formSchema>;

export default function WebsiteProjects() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<WebsiteProject | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      name: "",
      stage: "design",
      url: "",
      domain: "",
      hostingProvider: "",
      progress: 0,
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<WebsiteProject[]>({
    queryKey: ["/api/website-projects"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertWebsiteProject) => {
      return await apiRequest("POST", "/api/website-projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-projects"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Website project created successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create website project";
      toast({ title: errorMessage, variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertWebsiteProject> }) => {
      return await apiRequest("PATCH", `/api/website-projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-projects"] });
      setEditingProject(null);
      setDialogOpen(false);
      form.reset();
      toast({ title: "Website project updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Failed to update project", variant: "destructive" });
    },
  });

  const handleSubmit = (values: FormValues) => {
    const projectData: InsertWebsiteProject = {
      clientId: values.clientId,
      name: values.name,
      stage: values.stage,
      url: values.url || null,
      domain: values.domain || null,
      hostingProvider: values.hostingProvider || null,
      hostingExpiry: values.hostingExpiry && values.hostingExpiry.trim() ? new Date(values.hostingExpiry) : null,
      sslExpiry: values.sslExpiry && values.sslExpiry.trim() ? new Date(values.sslExpiry) : null,
      progress: values.progress || 0,
      launchDate: values.launchDate && values.launchDate.trim() ? new Date(values.launchDate) : null,
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const openEditDialog = (project: WebsiteProject) => {
    setEditingProject(project);
    form.reset({
      clientId: project.clientId,
      name: project.name,
      stage: project.stage,
      url: project.url ?? "",
      domain: project.domain ?? "",
      hostingProvider: project.hostingProvider ?? "",
      hostingExpiry: project.hostingExpiry ? format(new Date(project.hostingExpiry), "yyyy-MM-dd") : "",
      sslExpiry: project.sslExpiry ? format(new Date(project.sslExpiry), "yyyy-MM-dd") : "",
      progress: project.progress ?? 0,
      launchDate: project.launchDate ? format(new Date(project.launchDate), "yyyy-MM-dd") : "",
    });
    setDialogOpen(true);
  };

  const getStageColor = (stage: string) => {
    return STAGES.find(s => s.id === stage)?.color || "bg-slate-500";
  };

  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || "Unknown Client";
  };

  const getSSLStatusIcon = (status: string | null) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "expiring_soon":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "expired":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isExpiringSoon = (expiryDate: Date | string | null, days: number = 30) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= days;
  };

  const isExpired = (expiryDate: Date | string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry < now;
  };

  const getDaysUntilExpiry = (expiryDate: Date | string | null) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (projectsLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="p-6 lg:p-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="h-6 bg-muted/50 rounded w-48 shimmer"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted/50 rounded shimmer"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const projectsByStage = STAGES.map(stage => ({
    ...stage,
    projects: projects?.filter(p => p.stage === stage.id) || [],
  }));

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-4 md:space-y-6 lg:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">
              Website Projects
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Track website development from design to launch</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                form.reset();
                setEditingProject(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button data-testid="button-add-project">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-strong">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingProject ? "Edit Website Project" : "Create New Website Project"}
                </DialogTitle>
                <DialogDescription>
                  {editingProject ? "Update the project details" : "Add a new website development project"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-client">
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Corporate Website Redesign" data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-stage">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STAGES.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  {stage.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="progress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Progress (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              value={field.value ?? ""}
                              data-testid="input-progress"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="example.com" data-testid="input-domain" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Live URL</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="https://example.com" data-testid="input-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="hostingProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hosting Provider</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="Vercel, AWS, etc." data-testid="input-hosting" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hostingExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hosting Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} data-testid="input-hosting-expiry" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sslExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SSL Certificate Expiry</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} data-testid="input-ssl-expiry" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="launchDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Launch Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} data-testid="input-launch-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        form.reset();
                        setEditingProject(null);
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                      data-testid="button-submit-project"
                    >
                      {editingProject ? "Update Project" : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-8">
          {projectsByStage.map((stage) => (
            <div key={stage.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={`${stage.color} text-white`}>{stage.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  {stage.projects.length} {stage.projects.length === 1 ? "project" : "projects"}
                </span>
              </div>

              {stage.projects.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No projects in {stage.label} stage
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stage.projects.map((project) => (
                    <Card
                      key={project.id}
                      className="border-0 shadow-lg hover-elevate cursor-pointer"
                      onClick={() => openEditDialog(project)}
                      data-testid={`card-project-${project.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg truncate" data-testid={`text-project-name-${project.id}`}>
                                {project.name}
                              </CardTitle>
                              {(isExpired(project.sslExpiry) || isExpired(project.hostingExpiry)) && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Expired
                                </Badge>
                              )}
                              {(isExpiringSoon(project.sslExpiry) || isExpiringSoon(project.hostingExpiry)) && 
                               !(isExpired(project.sslExpiry) || isExpired(project.hostingExpiry)) && (
                                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="truncate">
                              {getClientName(project.clientId)}
                            </CardDescription>
                          </div>
                          <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress ?? 0} className="h-2" />
                        </div>

                        {project.domain && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Domain</span>
                            <span className="font-mono truncate ml-2">{project.domain}</span>
                          </div>
                        )}

                        {project.sslExpiry && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">SSL Certificate</span>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span className={
                                isExpired(project.sslExpiry) 
                                  ? "text-red-600 dark:text-red-400" 
                                  : isExpiringSoon(project.sslExpiry) 
                                    ? "text-amber-600 dark:text-amber-400" 
                                    : ""
                              }>
                                {isExpired(project.sslExpiry) && "Expired "}
                                {format(new Date(project.sslExpiry), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        )}

                        {project.hostingExpiry && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Hosting Expires</span>
                            <div className="flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              <span className={
                                isExpired(project.hostingExpiry) 
                                  ? "text-red-600 dark:text-red-400" 
                                  : isExpiringSoon(project.hostingExpiry) 
                                    ? "text-amber-600 dark:text-amber-400" 
                                    : ""
                              }>
                                {isExpired(project.hostingExpiry) && "Expired "}
                                {format(new Date(project.hostingExpiry), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      {project.launchDate && (
                        <CardFooter className="text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          Launched {format(new Date(project.launchDate), "MMM d, yyyy")}
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
