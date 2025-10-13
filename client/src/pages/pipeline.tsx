import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lead, InsertLead } from "@shared/schema";
import { insertLeadSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const STAGES = [
  { id: "prospect", label: "Prospect", gradient: "from-blue-500 to-cyan-500" },
  { id: "qualified", label: "Qualified", gradient: "from-purple-500 to-pink-500" },
  { id: "proposal", label: "Proposal", gradient: "from-amber-500 to-orange-500" },
  { id: "closed_won", label: "Closed Won", gradient: "from-emerald-500 to-teal-500" },
  { id: "closed_lost", label: "Closed Lost", gradient: "from-slate-400 to-slate-500" },
];

const SOURCES = [
  { id: "website", label: "Website" },
  { id: "ads", label: "Paid Ads" },
  { id: "form", label: "Lead Form" },
  { id: "call", label: "Phone Call" },
  { id: "referral", label: "Referral" },
  { id: "social", label: "Social Media" },
];

const formSchema = insertLeadSchema.extend({
  value: z.string().optional(),
}).omit({
  nextFollowUp: true,
  clientId: true,
  assignedToId: true,
  sourceMetadata: true,
});

type FormValues = z.infer<typeof formSchema>;

export default function Pipeline() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      stage: "prospect",
      score: "warm",
      value: "",
      source: "website",
      notes: "",
    },
  });

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      return await apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Lead created successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create lead";
      toast({ title: errorMessage, variant: "destructive" });
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

  const handleCreateLead = (values: FormValues) => {
    const leadData: InsertLead = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      company: values.company || null,
      stage: values.stage,
      score: values.score,
      value: values.value ? parseInt(values.value) * 100 : null, // Convert to cents
      source: values.source,
      notes: values.notes || null,
    };

    createLeadMutation.mutate(leadData);
  };

  const getScoreGradient = (score: string) => {
    switch (score) {
      case "hot": return "from-red-500 to-orange-500";
      case "warm": return "from-amber-500 to-yellow-500";
      case "cold": return "from-blue-500 to-cyan-500";
      default: return "from-slate-400 to-slate-500";
    }
  };

  const leadsByStage = STAGES.map(stage => ({
    ...stage,
    leads: leads?.filter(lead => lead.stage === stage.id) || [],
  }));

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="p-6 lg:p-8">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="h-6 bg-muted/50 rounded w-24 shimmer"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted/50 rounded shimmer"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Sales Pipeline</h1>
            <p className="text-lg text-muted-foreground">Track leads through your sales process</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) form.reset();
          }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-lead">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Lead</DialogTitle>
              <DialogDescription>Add a new lead to your sales pipeline</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateLead)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-lead-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-stage">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STAGES.map(stage => (
                              <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-score">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Value ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" data-testid="input-value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-source">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOURCES.map(source => (
                              <SelectItem key={source.id} value={source.id}>{source.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {leadsByStage.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${stage.gradient} shadow-md`}></div>
                    <CardTitle className="text-base font-semibold">{stage.label}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {stage.leads.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {stage.leads.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-4 hover-elevate cursor-pointer transition-all border-0 bg-card/50"
                    data-testid={`card-lead-${lead.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{lead.name}</h4>
                        <Badge className={`bg-gradient-to-r ${getScoreGradient(lead.score)} text-white shadow-md`}>
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
    </div>
  );
}
