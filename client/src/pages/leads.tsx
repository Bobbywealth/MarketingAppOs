import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  Zap,
  PhoneCall,
  Square,
  CheckSquare,
  X,
  Upload,
  FileText,
  Download,
  LayoutGrid,
  List,
  Eye,
  Globe,
  Flame,
  Snowflake,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<any[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  
  // New state for modern UI
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [quickFilterStage, setQuickFilterStage] = useState<string | null>(null);
  const [quickFilterScore, setQuickFilterScore] = useState<string | null>(null);
  const [quickFilterSource, setQuickFilterSource] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Populate editTags when editing a lead
  useEffect(() => {
    if (editingLead && editingLead.tags) {
      setEditTags(Array.isArray(editingLead.tags) ? editingLead.tags : []);
    } else {
      setEditTags([]);
    }
  }, [editingLead]);

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
      toast({ title: "✅ Lead updated successfully!" });
      setIsEditDialogOpen(false);
      setEditingLead(null);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update lead", 
        description: error?.message,
        variant: "destructive" 
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ 
        title: "🗑️ Lead deleted", 
        description: "The lead has been permanently removed" 
      });
      setSelectedLead(null);
      setLeadToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete lead", 
        description: error?.message,
        variant: "destructive" 
      });
      setLeadToDelete(null);
    },
  });

  const bulkDeleteLeadsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map(id => apiRequest("DELETE", `/api/leads/${id}`)));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ 
        title: `🗑️ ${ids.length} leads deleted`, 
        description: "The selected leads have been permanently removed" 
      });
      setSelectedLeads(new Set());
      setShowBulkActions(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete leads", 
        description: error?.message,
        variant: "destructive" 
      });
    },
  });

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const selectAllLeads = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeads.size > 0) {
      bulkDeleteLeadsMutation.mutate(Array.from(selectedLeads));
    }
  };

  const parseFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest("POST", "/api/leads/parse-file", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setParsedLeads(data.leads || []);
      toast({ 
        title: `✅ Found ${data.leads?.length || 0} leads`, 
        description: "Review and confirm to import" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to parse file", 
        description: error?.message,
        variant: "destructive" 
      });
    },
  });

  const bulkImportLeadsMutation = useMutation({
    mutationFn: async (leads: any[]) => {
      const response = await apiRequest("POST", "/api/leads/bulk-import", { leads });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ 
        title: `🎉 ${data.imported || 0} leads imported successfully!`, 
        description: data.skipped ? `${data.skipped} duplicates skipped` : undefined
      });
      setIsImportDialogOpen(false);
      setImportFile(null);
      setParsedLeads([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to import leads", 
        description: error?.message,
        variant: "destructive" 
      });
    },
  });

  const handleFileSelect = async (file: File) => {
    setImportFile(file);
    setIsParsingFile(true);
    try {
      await parseFileMutation.mutateAsync(file);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleImportConfirm = () => {
    if (parsedLeads.length > 0) {
      bulkImportLeadsMutation.mutate(parsedLeads);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || lead.stage === filterStatus;
    const matchesIndustry = filterIndustry === "all" || !filterIndustry || lead.industry === filterIndustry;
    
    // Quick filters
    const matchesQuickStage = !quickFilterStage || lead.stage === quickFilterStage;
    const matchesQuickScore = !quickFilterScore || lead.score === quickFilterScore;
    const matchesQuickSource = !quickFilterSource || lead.source === quickFilterSource;
    
    return matchesSearch && matchesStatus && matchesIndustry && matchesQuickStage && matchesQuickScore && matchesQuickSource;
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
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Leads Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track and manage your sales leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/lead-import-template.csv';
              link.download = 'lead-import-template.csv';
              link.click();
            }}
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4" />
            Import Leads
          </Button>
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
              <DialogDescription>Create a new lead in your pipeline (Company name is required)</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: InsertLead = {
                name: formData.get("name") as string || null,
                email: formData.get("email") as string || null,
                phone: formData.get("phone") as string || null,
                company: formData.get("company") as string,
                website: formData.get("website") as string || null,
                industry: formData.get("industry") as string || null,
                tags: newTags,
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
              setNewTags([]); // Reset tags after submission
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input name="name" placeholder="John Doe" />
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
                  <Label>Company *</Label>
                  <Input name="company" placeholder="Acme Inc" required />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Select name="industry">
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">💻 Technology</SelectItem>
                      <SelectItem value="healthcare">🏥 Healthcare</SelectItem>
                      <SelectItem value="finance">🏦 Finance</SelectItem>
                      <SelectItem value="retail">🛒 Retail</SelectItem>
                      <SelectItem value="construction">🏗️ Construction</SelectItem>
                      <SelectItem value="education">📚 Education</SelectItem>
                      <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                      <SelectItem value="real_estate">🏠 Real Estate</SelectItem>
                      <SelectItem value="hospitality">🏨 Hospitality</SelectItem>
                      <SelectItem value="media">📺 Media & Entertainment</SelectItem>
                      <SelectItem value="legal">⚖️ Legal</SelectItem>
                      <SelectItem value="consulting">💼 Consulting</SelectItem>
                      <SelectItem value="other">🏢 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
                            setNewTags([...newTags, newTagInput.trim()]);
                            setNewTagInput("");
                          }
                        }
                      }}
                      placeholder="Type and press Enter"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
                          setNewTags([...newTags, newTagInput.trim()]);
                          setNewTagInput("");
                        }
                      }}
                    >
                      + Add
                    </Button>
                  </div>
                  {newTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive" 
                            onClick={() => setNewTags(newTags.filter(t => t !== tag))}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
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

        {/* Edit Lead Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>Update lead information</DialogDescription>
            </DialogHeader>
            {editingLead && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: Partial<InsertLead> = {
                  name: formData.get("name") as string || null,
                  email: formData.get("email") as string || null,
                  phone: formData.get("phone") as string || null,
                  company: formData.get("company") as string,
                  website: formData.get("website") as string || null,
                  industry: formData.get("industry") as string || null,
                  tags: editTags,
                  stage: formData.get("stage") as string,
                  score: formData.get("score") as string,
                  source: formData.get("source") as string,
                  value: formData.get("value") ? parseInt(formData.get("value") as string) * 100 : null,
                  notes: formData.get("notes") as string || null,
                };
                updateLeadMutation.mutate({ id: editingLead.id, data });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input name="name" defaultValue={editingLead.name} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input name="email" type="email" defaultValue={editingLead.email || ""} placeholder="john@example.com" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input name="phone" type="tel" defaultValue={editingLead.phone || ""} placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <Label>Company *</Label>
                    <Input name="company" defaultValue={editingLead.company || ""} placeholder="Acme Inc" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Website</Label>
                    <Input name="website" type="url" defaultValue={editingLead.website || ""} placeholder="https://example.com" />
                  </div>
                  <div>
                    <Label>Lead Value ($)</Label>
                    <Input name="value" type="number" defaultValue={editingLead.value ? editingLead.value / 100 : ""} placeholder="5000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Industry</Label>
                    <Select name="industry" defaultValue={editingLead.industry || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">💻 Technology</SelectItem>
                        <SelectItem value="healthcare">🏥 Healthcare</SelectItem>
                        <SelectItem value="finance">🏦 Finance</SelectItem>
                        <SelectItem value="retail">🛒 Retail</SelectItem>
                        <SelectItem value="construction">🏗️ Construction</SelectItem>
                        <SelectItem value="education">📚 Education</SelectItem>
                        <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                        <SelectItem value="real_estate">🏠 Real Estate</SelectItem>
                        <SelectItem value="hospitality">🏨 Hospitality</SelectItem>
                        <SelectItem value="media">📺 Media & Entertainment</SelectItem>
                        <SelectItem value="legal">⚖️ Legal</SelectItem>
                        <SelectItem value="consulting">💼 Consulting</SelectItem>
                        <SelectItem value="other">🏢 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTagInput.trim() && !editTags.includes(newTagInput.trim())) {
                              setEditTags([...editTags, newTagInput.trim()]);
                              setNewTagInput("");
                            }
                          }
                        }}
                        placeholder="Type and press Enter"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (newTagInput.trim() && !editTags.includes(newTagInput.trim())) {
                            setEditTags([...editTags, newTagInput.trim()]);
                            setNewTagInput("");
                          }
                        }}
                      >
                        + Add
                      </Button>
                    </div>
                    {editTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {editTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => setEditTags(editTags.filter(t => t !== tag))}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Stage *</Label>
                    <Select name="stage" defaultValue={editingLead.stage} required>
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
                    <Select name="score" defaultValue={editingLead.score || "warm"} required>
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
                    <Select name="source" defaultValue={editingLead.source} required>
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
                  <Textarea name="notes" defaultValue={editingLead.notes || ""} placeholder="Additional information about this lead..." rows={3} />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingLead(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateLeadMutation.isPending}>
                    {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </div>
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
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        if (selectedLead.email) {
                          window.location.href = `mailto:${selectedLead.email}`;
                        }
                      }}
                      className="flex-1"
                      disabled={!selectedLead.email}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedLead.phone) {
                          setSelectedLead(null);
                          setLocation(`/phone?number=${encodeURIComponent(selectedLead.phone)}&action=call`);
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={!selectedLead.phone}
                    >
                      <PhoneCall className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedLead.phone) {
                          setSelectedLead(null);
                          setLocation(`/phone?number=${encodeURIComponent(selectedLead.phone)}&action=sms`);
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={!selectedLead.phone}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      SMS
                    </Button>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingLead(selectedLead);
                      setIsEditDialogOpen(true);
                      setSelectedLead(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Lead
                  </Button>
                  <Button 
                    onClick={() => setLeadToDelete(selectedLead)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Lead
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

      {/* Bulk Actions Toolbar */}
      {showBulkActions && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedLeads(new Set());
                    setShowBulkActions(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <span className="text-sm font-medium">
                  {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteLeadsMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {bulkDeleteLeadsMutation.isPending ? "Deleting..." : "Delete Selected"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <button
                onClick={selectAllLeads}
                className="p-1 hover:bg-accent rounded transition-colors"
                title={selectedLeads.size === filteredLeads.length ? "Deselect all" : "Select all"}
              >
                {selectedLeads.size === filteredLeads.length && filteredLeads.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              All Leads ({filteredLeads.length})
            </CardTitle>
          </div>
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
                <Card 
                  key={lead.id} 
                  className={`hover-elevate group cursor-pointer transition-all ${
                    selectedLeads.has(lead.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedLead(lead)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLeadSelection(lead.id);
                          }}
                          className="mt-1 p-1 hover:bg-accent rounded transition-colors"
                          title={selectedLeads.has(lead.id) ? "Deselect" : "Select"}
                        >
                          {selectedLeads.has(lead.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
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
                            setEditingLead(lead);
                            setIsEditDialogOpen(true);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{leadToDelete?.name}</strong>? This action cannot be undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leadToDelete) {
                  deleteLeadMutation.mutate(leadToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLeadMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Leads Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV or PDF file to import multiple leads at once. AI will automatically extract lead information from PDFs.
            </DialogDescription>
          </DialogHeader>

          {/* Template Download Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  First time importing? Download our template!
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Includes all required fields and example data
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/lead-import-template.csv';
                link.download = 'lead-import-template.csv';
                link.click();
                toast({ title: "✅ Template Downloaded", description: "Open the file, add your leads, and upload it back here!" });
              }}
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {!importFile && !parsedLeads.length ? (
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById('file-input')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary');
                const file = e.dataTransfer.files[0];
                if (file && (file.type === 'text/csv' || file.type === 'application/pdf')) {
                  handleFileSelect(file);
                } else {
                  toast({ title: "Invalid file type", description: "Please upload a CSV or PDF file", variant: "destructive" });
                }
              }}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Drop your file here, or click to browse</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports CSV and PDF files (max 10MB)
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  CSV
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  PDF
                </div>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".csv,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : isParsingFile ? (
            <div className="py-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium mb-2">Parsing your file...</p>
              <p className="text-sm text-muted-foreground">
                {importFile?.type === 'application/pdf' ? 'Using AI to extract lead information from PDF' : 'Processing CSV data'}
              </p>
            </div>
          ) : parsedLeads.length > 0 ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    {parsedLeads.length} lead{parsedLeads.length !== 1 ? 's' : ''} found!
                  </h4>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Review the leads below and click "Import All" to add them to your pipeline.
                </p>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-3">
                  {parsedLeads.map((lead, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Name</Label>
                            <p className="font-medium">{lead.name || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Email</Label>
                            <p className="font-medium">{lead.email || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <p className="font-medium">{lead.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Company</Label>
                            <p className="font-medium">{lead.company || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImportFile(null);
                    setParsedLeads([]);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleImportConfirm}
                  disabled={bulkImportLeadsMutation.isPending}
                  className="gap-2"
                >
                  {bulkImportLeadsMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Import All {parsedLeads.length} Lead{parsedLeads.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

