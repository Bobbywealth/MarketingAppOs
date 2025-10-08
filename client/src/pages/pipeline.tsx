import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";

const STAGES = [
  { id: "lead", label: "Lead", color: "bg-chart-1" },
  { id: "contacted", label: "Contacted", color: "bg-chart-2" },
  { id: "proposal", label: "Proposal", color: "bg-chart-4" },
  { id: "closed_won", label: "Closed Won", color: "bg-chart-3" },
  { id: "closed_lost", label: "Closed Lost", color: "bg-muted" },
];

export default function Pipeline() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setDialogOpen(false);
      toast({ title: "Lead created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create lead", variant: "destructive" });
    },
  });

  const updateLeadStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      return await apiRequest("PATCH", `/api/leads/${id}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead stage updated" });
    },
  });

  const handleCreateLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createLeadMutation.mutate({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      stage: formData.get("stage"),
      score: formData.get("score"),
      value: formData.get("value") ? parseInt(formData.get("value") as string) : null,
      source: formData.get("source"),
      notes: formData.get("notes"),
    });
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case "hot": return "bg-destructive text-destructive-foreground";
      case "warm": return "bg-chart-4 text-white";
      case "cold": return "bg-chart-5 text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const leadsByStage = STAGES.map(stage => ({
    ...stage,
    leads: leads?.filter(lead => lead.stage === stage.id) || [],
  }));

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track leads through your sales process</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-lead">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Lead Name *</Label>
                  <Input id="name" name="name" required data-testid="input-lead-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" data-testid="input-company" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select name="stage" defaultValue="lead">
                    <SelectTrigger data-testid="select-stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Score *</Label>
                  <Select name="score" defaultValue="warm">
                    <SelectTrigger data-testid="select-score">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Deal Value ($)</Label>
                  <Input id="value" name="value" type="number" data-testid="input-value" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" name="source" placeholder="e.g., Website, Referral" data-testid="input-source" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" data-testid="input-notes" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLeadMutation.isPending} data-testid="button-submit-lead">
                  {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {leadsByStage.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">{stage.label}</CardTitle>
                  <Badge variant="secondary" className="font-mono">
                    {stage.leads.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {stage.leads.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-4 hover-elevate cursor-pointer transition-shadow"
                    data-testid={`card-lead-${lead.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{lead.name}</h4>
                        <Badge className={getScoreColor(lead.score)} variant="secondary">
                          {lead.score}
                        </Badge>
                      </div>
                      {lead.company && (
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                      )}
                      {lead.value && (
                        <p className="text-sm font-semibold text-primary">
                          ${lead.value.toLocaleString()}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                      )}
                    </div>
                  </Card>
                ))}
                {stage.leads.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No leads in this stage
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
