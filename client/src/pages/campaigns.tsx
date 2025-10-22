import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, DollarSign, Target, MoreVertical, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Campaign, Client } from "@shared/schema";

export default function Campaigns() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
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

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      toast({ title: "Campaign deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
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

  const handleDeleteClick = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (campaignToDelete) {
      deleteCampaignMutation.mutate(campaignToDelete);
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "active": return "from-emerald-500 to-teal-500";
      case "planning": return "from-blue-500 to-cyan-500";
      case "paused": return "from-amber-500 to-orange-500";
      case "completed": return "from-slate-400 to-slate-500";
      default: return "from-slate-400 to-slate-500";
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case "social": return "from-blue-500/20 to-cyan-500/20";
      case "ads": return "from-orange-500/20 to-pink-500/20";
      case "content": return "from-emerald-500/20 to-teal-500/20";
      case "email": return "from-violet-500/20 to-purple-500/20";
      default: return "from-slate-400/20 to-slate-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass">
                <CardHeader>
                  <div className="h-6 bg-muted/50 rounded w-3/4 shimmer"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/50 rounded shimmer"></div>
                    <div className="h-4 bg-muted/50 rounded w-5/6 shimmer"></div>
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
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Campaigns</h1>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Manage your marketing campaigns</p>
          </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-all" data-testid="button-add-campaign">
              <Plus className="w-5 h-5 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Campaign</DialogTitle>
              <DialogDescription>Set up a new marketing campaign for your client</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select name="clientId" required>
                    <SelectTrigger data-testid="select-campaign-client" className="glass">
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
                  <Input id="name" name="name" required data-testid="input-campaign-name" className="glass" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" required>
                    <SelectTrigger data-testid="select-campaign-type" className="glass">
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
                    <SelectTrigger data-testid="select-campaign-status" className="glass">
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
                  <Input id="startDate" name="startDate" type="date" data-testid="input-start-date" className="glass" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" data-testid="input-end-date" className="glass" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input id="budget" name="budget" type="number" data-testid="input-budget" className="glass" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="goals">Goals</Label>
                  <Textarea id="goals" name="goals" data-testid="input-goals" className="glass" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" data-testid="input-description" className="glass" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending} data-testid="button-submit-campaign" className="shadow-md">
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-fade-in">
        {campaigns?.map((campaign) => (
          <Card 
            key={campaign.id} 
            className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover-lift gradient-border"
            data-testid={`card-campaign-${campaign.id}`}
          >
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(campaign.type)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            <CardHeader className="relative">
              <div className="flex items-start justify-between gap-2 mb-3">
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                  {campaign.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`bg-gradient-to-r ${getStatusGradient(campaign.status)} text-white shadow-md`}>
                    {campaign.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => handleDeleteClick(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Campaign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Badge className={`bg-gradient-to-r ${getTypeGradient(campaign.type)} border-0 w-fit shadow-sm`} variant="outline">
                {campaign.type}
              </Badge>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {campaign.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {campaign.description}
                </p>
              )}
              
              <div className="space-y-2">
                {campaign.budget && (
                  <div className="flex items-center gap-2 p-2 rounded-lg hover-elevate transition-all">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="text-sm font-semibold font-mono">${campaign.budget.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {campaign.startDate && campaign.endDate && (
                  <div className="flex items-center gap-2 p-2 rounded-lg hover-elevate transition-all">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {campaign.goals && (
                  <div className="flex items-center gap-2 p-2 rounded-lg hover-elevate transition-all">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Goals</p>
                      <p className="text-sm line-clamp-1">{campaign.goals}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns?.length === 0 && (
        <Card className="border-dashed border-2 glass-strong">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-lg">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Campaigns Yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Get started by creating your first marketing campaign
            </p>
            <Button onClick={() => setDialogOpen(true)} size="lg" className="shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCampaignMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
