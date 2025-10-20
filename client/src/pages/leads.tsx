import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  Edit,
  Trash2,
  Send,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import type { Lead, InsertLead } from "@shared/schema";

// Helper function to get badge variant based on stage
function getStageBadge(stage: string): "default" | "secondary" | "outline" | "destructive" {
  switch (stage) {
    case "prospect":
      return "secondary";
    case "qualified":
      return "default";
    case "proposal":
      return "outline";
    case "closed_won":
      return "default";
    case "closed_lost":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function LeadsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      return apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "✅ Lead created successfully!" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create lead", 
        description: error?.message,
        variant: "destructive" 
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLead> }) => {
      return apiRequest("PATCH", `/api/leads/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead updated successfully" });
    },
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || lead.stage === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const leadStats = {
    total: leads.length,
    prospect: leads.filter(l => l.stage === "prospect").length,
    qualified: leads.filter(l => l.stage === "qualified").length,
    proposal: leads.filter(l => l.stage === "proposal").length,
    closedWon: leads.filter(l => l.stage === "closed_won").length,
    closedLost: leads.filter(l => l.stage === "closed_lost").length,
    // Temperature stats
    hot: leads.filter(l => l.score === "hot").length,
    warm: leads.filter(l => l.score === "warm").length,
    cold: leads.filter(l => l.score === "cold").length,
  };

  const getStageColor = (stage: string) => {
    const colors = {
      prospect: "bg-blue-500",
      qualified: "bg-green-500",
      proposal: "bg-orange-500",
      closed_won: "bg-emerald-500",
      closed_lost: "bg-red-500",
    };
    return colors[stage as keyof typeof colors] || "bg-gray-500";
  };

  const getStageBadge = (stage: string) => {
    const colors = {
      prospect: "default",
      qualified: "default",
      proposal: "secondary",
      closed_won: "default",
      closed_lost: "destructive",
    };
    return colors[stage as keyof typeof colors] || "default";
  };

  const getScoreColor = (score: string) => {
    const colors = {
      hot: "text-red-500",
      warm: "text-orange-500",
      cold: "text-blue-500",
    };
    return colors[score as keyof typeof colors] || "text-gray-500";
  };

  const getScoreBadge = (score: string) => {
    const colors = {
      hot: "destructive",
      warm: "default",
      cold: "secondary",
    };
    return colors[score as keyof typeof colors] || "default";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <p className="text-muted-foreground">Track and manage your sales leads</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Create a new lead in your pipeline</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: InsertLead = {
                name: formData.get("name") as string,
                email: formData.get("email") as string || null,
                phone: formData.get("phone") as string || null,
                company: formData.get("company") as string || null,
                website: formData.get("website") as string || null,
                stage: formData.get("stage") as string,
                score: formData.get("score") as string,
                source: formData.get("source") as string,
                value: formData.get("value") ? parseInt(formData.get("value") as string) * 100 : null, // Convert to cents
                notes: formData.get("notes") as string || null,
                clientId: null,
                assignedToId: null,
                sourceMetadata: null,
                nextFollowUp: null,
              };
              createLeadMutation.mutate(data);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input name="name" placeholder="John Doe" required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="john@example.com" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input name="company" placeholder="Acme Inc" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Website</Label>
                  <Input name="website" type="url" placeholder="https://example.com" />
                </div>
                <div>
                  <Label>Lead Value ($)</Label>
                  <Input name="value" type="number" placeholder="5000" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Stage *</Label>
                  <Select name="stage" defaultValue="prospect" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Temperature *</Label>
                  <Select name="score" defaultValue="warm" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">🔥 Hot</SelectItem>
                      <SelectItem value="warm">☀️ Warm</SelectItem>
                      <SelectItem value="cold">❄️ Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lead Source *</Label>
                  <Select name="source" defaultValue="website" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="ads">Advertising</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="form">Lead Form</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Additional information about this lead..." rows={3} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLeadMutation.isPending}>
                  {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedLead.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-2">
                      <Badge variant={getStageBadge(selectedLead.stage)}>
                        {selectedLead.stage.replace('_', ' ')}
                      </Badge>
                      {selectedLead.score && (
                        <Badge 
                          variant="outline" 
                          className={`gap-1 ${
                            selectedLead.score === 'hot' ? 'border-red-500 text-red-700 bg-red-50' :
                            selectedLead.score === 'warm' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                            'border-blue-500 text-blue-700 bg-blue-50'
                          }`}
                        >
                          {selectedLead.score === 'hot' && '🔥'}
                          {selectedLead.score === 'warm' && '☀️'}
                          {selectedLead.score === 'cold' && '❄️'}
                          <span className="ml-1 capitalize">{selectedLead.score} Lead</span>
                        </Badge>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">
                          {selectedLead.email}
                        </a>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline">
                          {selectedLead.phone}
                        </a>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedLead.company}</span>
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lead Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Lead Details</h3>
                  <div className="space-y-2">
                    {selectedLead.value && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground">Potential Value</span>
                        <span className="font-semibold">${(selectedLead.value / 100).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Source</span>
                      <span className="capitalize">{selectedLead.source.replace('_', ' ')}</span>
                    </div>
                    {selectedLead.createdAt && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground">Added</span>
                        <span>{format(new Date(selectedLead.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Notes</h3>
                    <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                      {selectedLead.notes}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      if (selectedLead.email) {
                        window.location.href = `mailto:${selectedLead.email}`;
                      }
                    }}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedLead.phone) {
                        window.location.href = `tel:${selectedLead.phone}`;
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{leadStats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold">{leadStats.new}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold">{leadStats.contacted}</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold">{leadStats.qualified}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold">{leadStats.converted}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lost</p>
                <p className="text-2xl font-bold">{leadStats.lost}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, or company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No leads found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || filterStatus !== "all" 
                  ? "Try adjusting your filters"
                  : "Start by adding your first lead"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <Card key={lead.id} className="hover-elevate group cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{lead.name}</h3>
                            <Badge variant={getStageBadge(lead.stage)}>
                              {lead.stage.replace('_', ' ')}
                            </Badge>
                            {lead.score === "hot" && (
                              <Badge variant="outline" className="gap-1">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                Hot Lead
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {lead.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            {lead.company && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Building2 className="w-3 h-3" />
                                <span>{lead.company}</span>
                              </div>
                            )}
                            {lead.value && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign className="w-3 h-3" />
                                <span>${lead.value.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {lead.score && (
                            <div className="mt-2">
                              <Badge 
                                variant="outline" 
                                className={`gap-1 ${
                                  lead.score === 'hot' ? 'border-red-500 text-red-700 bg-red-50' :
                                  lead.score === 'warm' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                  'border-blue-500 text-blue-700 bg-blue-50'
                                }`}
                              >
                                {lead.score === 'hot' && '🔥'}
                                {lead.score === 'warm' && '☀️'}
                                {lead.score === 'cold' && '❄️'}
                                <span className="ml-1 capitalize">{lead.score} Lead</span>
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (lead.email) {
                              window.location.href = `mailto:${lead.email}`;
                            }
                          }}
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (lead.phone) {
                              window.location.href = `tel:${lead.phone}`;
                            }
                          }}
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedLead(lead);
                          }}
                          title="Edit Lead"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedLead(lead);
                          }}
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {lead.source && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Source: {lead.source.replace('_', ' ')}</span>
                          {lead.createdAt && (
                            <>
                              <span>•</span>
                              <span>Added {format(new Date(lead.createdAt), 'MMM d, yyyy')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

