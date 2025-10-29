import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, MessageSquare, Clock, CheckCircle, XCircle, Timer, User, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Ticket, Client } from "@shared/schema";

export default function Tickets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery({ queryKey: ["/api/user"] });
  const isClient = user?.role === 'client';

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !isClient, // Only fetch clients list for admin/staff
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setDialogOpen(false);
      toast({ title: "Ticket created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create ticket", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/tickets/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket status updated" });
    },
  });

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // For client users, use their clientId automatically
    const clientId = isClient ? user?.clientId : formData.get("clientId");

    createTicketMutation.mutate({
      clientId,
      subject: formData.get("subject"),
      description: formData.get("description"),
      priority: formData.get("priority"),
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh overflow-x-hidden">
        <div className="p-6 lg:p-8 xl:p-12">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6 border-0 shadow-lg">
                <div className="space-y-3">
                  <div className="h-5 bg-muted/50 rounded w-2/3 shimmer"></div>
                  <div className="h-4 bg-muted/50 rounded shimmer"></div>
                  <div className="h-4 bg-muted/50 rounded w-1/3 shimmer"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate ticket stats
  const ticketStats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
    urgent: tickets?.filter(t => t.priority === 'urgent').length || 0,
  };

  return (
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-4 md:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Support Tickets</h1>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
              {isClient ? "Get help and support from our team" : "Admin ticket management dashboard"}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ticket">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create Support Ticket</DialogTitle>
              <DialogDescription>Create a new support ticket for client assistance</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-4">
                {/* Only show client selector for admin/staff, not for clients */}
                {!isClient && (
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client *</Label>
                    <Select name="clientId" required>
                      <SelectTrigger data-testid="select-ticket-client">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" name="subject" required data-testid="input-subject" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={5} data-testid="input-description" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTicketMutation.isPending} data-testid="button-submit-ticket">
                  {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-3xl font-bold">{ticketStats.open}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold">{ticketStats.in_progress}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Timer className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-3xl font-bold">{ticketStats.resolved}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Urgent</p>
                  <p className="text-3xl font-bold">{ticketStats.urgent}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table with Tabs */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b">
            <CardTitle>Ticket Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  All ({ticketStats.total})
                </TabsTrigger>
                <TabsTrigger value="open" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Open ({ticketStats.open})
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  In Progress ({ticketStats.in_progress})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Resolved ({ticketStats.resolved})
                </TabsTrigger>
                <TabsTrigger value="urgent" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Urgent ({ticketStats.urgent})
                </TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="all" className="mt-0 space-y-4">
                  {tickets?.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} updateStatusMutation={updateStatusMutation} />
                  ))}
                  {tickets?.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">No support tickets</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="open" className="mt-0 space-y-4">
                  {tickets?.filter(t => t.status === 'open').map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} updateStatusMutation={updateStatusMutation} />
                  ))}
                  {tickets?.filter(t => t.status === 'open').length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No open tickets</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="in_progress" className="mt-0 space-y-4">
                  {tickets?.filter(t => t.status === 'in_progress').map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} updateStatusMutation={updateStatusMutation} />
                  ))}
                  {tickets?.filter(t => t.status === 'in_progress').length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No tickets in progress</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="resolved" className="mt-0 space-y-4">
                  {tickets?.filter(t => t.status === 'resolved').map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} updateStatusMutation={updateStatusMutation} />
                  ))}
                  {tickets?.filter(t => t.status === 'resolved').length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No resolved tickets</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="urgent" className="mt-0 space-y-4">
                  {tickets?.filter(t => t.priority === 'urgent').map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} updateStatusMutation={updateStatusMutation} />
                  ))}
                  {tickets?.filter(t => t.priority === 'urgent').length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No urgent tickets</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ticket Card Component
function TicketCard({ ticket, updateStatusMutation }: { ticket: Ticket; updateStatusMutation: any }) {
  return (
    <Card className="hover-elevate transition-shadow" data-testid={`card-ticket-${ticket.id}`}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {ticket.priority === "urgent" && (
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
                <h3 className="font-semibold truncate">{ticket.subject}</h3>
              </div>
              {ticket.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={getStatusColor(ticket.status)} variant="secondary">
                {ticket.status.replace("_", " ")}
              </Badge>
              {ticket.priority === "urgent" && (
                <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                  {ticket.priority}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
            {ticket.status === "open" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({ id: ticket.id, status: "in_progress" })}
                data-testid={`button-start-${ticket.id}`}
              >
                Start Working
              </Button>
            )}
            {ticket.status === "in_progress" && (
              <Button
                size="sm"
                onClick={() => updateStatusMutation.mutate({ id: ticket.id, status: "resolved" })}
                data-testid={`button-resolve-${ticket.id}`}
              >
                Mark Resolved
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions moved outside component
function getStatusColor(status: string) {
  switch (status) {
    case "open": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "closed": return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    default: return "";
  }
}

function getPriorityColor(priority: string) {
  return priority === "urgent"
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
}
