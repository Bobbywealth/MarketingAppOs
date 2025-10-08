import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Ticket, Client } from "@shared/schema";

export default function Tickets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
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

    createTicketMutation.mutate({
      clientId: formData.get("clientId"),
      subject: formData.get("subject"),
      description: formData.get("description"),
      priority: formData.get("priority"),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-chart-4 text-white";
      case "in_progress": return "bg-chart-1 text-white";
      case "resolved": return "bg-chart-3 text-white";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === "urgent" 
      ? "bg-destructive text-destructive-foreground" 
      : "bg-secondary text-secondary-foreground";
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-5 bg-muted rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">Support Tickets</h1>
          <p className="text-muted-foreground">Manage client support requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ticket">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-4">
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

      <div className="space-y-4">
        {tickets?.map((ticket) => (
          <Card key={ticket.id} className="hover-elevate transition-shadow" data-testid={`card-ticket-${ticket.id}`}>
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
        ))}
      </div>

      {tickets?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No support tickets</p>
        </div>
      )}
    </div>
  );
}
