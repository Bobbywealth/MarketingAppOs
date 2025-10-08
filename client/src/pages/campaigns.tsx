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
import type { Campaign, Client } from "@shared/schema";

export default function Campaigns() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setDialogOpen(false);
      toast({ title: "Campaign created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    },
  });

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createCampaignMutation.mutate({
      clientId: formData.get("clientId"),
      name: formData.get("name"),
      type: formData.get("type"),
      status: formData.get("status"),
      budget: formData.get("budget") ? parseInt(formData.get("budget") as string) : null,
      description: formData.get("description"),
      goals: formData.get("goals"),
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : null,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-chart-3 text-white";
      case "planning": return "bg-chart-1 text-white";
      case "paused": return "bg-chart-4 text-white";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "social": return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      case "ads": return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "content": return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "email": return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">Campaigns</h1>
          <p className="text-muted-foreground">Manage your marketing campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-campaign">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select name="clientId" required>
                    <SelectTrigger data-testid="select-campaign-client">
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
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input id="name" name="name" required data-testid="input-campaign-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" required>
                    <SelectTrigger data-testid="select-campaign-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="ads">Ads</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue="planning">
                    <SelectTrigger data-testid="select-campaign-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" data-testid="input-start-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" data-testid="input-end-date" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input id="budget" name="budget" type="number" data-testid="input-budget" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="goals">Goals</Label>
                  <Textarea id="goals" name="goals" data-testid="input-goals" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" data-testid="input-description" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending} data-testid="button-submit-campaign">
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id} className="hover-elevate transition-shadow" data-testid={`card-campaign-${campaign.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <Badge className={getStatusColor(campaign.status)} variant="secondary">
                  {campaign.status}
                </Badge>
              </div>
              <Badge className={`${getTypeColor(campaign.type)} border w-fit`} variant="outline">
                {campaign.type}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {campaign.description}
                </p>
              )}
              {campaign.budget && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Budget: </span>
                  <span className="font-medium">${campaign.budget.toLocaleString()}</span>
                </div>
              )}
              {campaign.startDate && campaign.endDate && (
                <div className="text-xs text-muted-foreground">
                  {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No campaigns yet</p>
        </div>
      )}
    </div>
  );
}
