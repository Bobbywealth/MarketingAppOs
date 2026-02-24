import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
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
  ExternalLink,
  Instagram,
  Facebook,
  MapPinned,
  Columns3,
  Sparkles,
  Wand2,
  BrainCircuit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import type { Lead, InsertLead } from "@shared/schema";
import { LeadsKanban } from "@/components/LeadsKanban";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadListView } from "@/components/leads/LeadListView";

function getStageBadge(
  stage: string,
): "default" | "secondary" | "outline" | "destructive" {
  const colors: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    prospect: "secondary",
    qualified: "default",
    proposal: "outline",
    closed_won: "default",
    closed_lost: "destructive",
  };
  return colors[stage] || "secondary";
}

// Activity Timeline Component
function LeadActivityTimeline({ leadId }: { leadId: string }) {
  const { toast } = useToast();

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: [`/api/leads/${leadId}/activities`],
    enabled: !!leadId,
  });

  const activities = (activitiesData || []) as any[];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case "email":
        return <Mail className="w-4 h-4 text-purple-600" />;
      case "sms":
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "meeting":
        return <Calendar className="w-4 h-4 text-orange-600" />;
      case "note":
        return <FileText className="w-4 h-4 text-gray-600" />;
      case "stage_change":
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;

    switch (outcome) {
      case "positive":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ✅ Positive
          </Badge>
        );
      case "neutral":
        return <Badge variant="secondary">➖ Neutral</Badge>;
      case "negative":
        return <Badge variant="destructive">❌ Negative</Badge>;
      case "no_answer":
        return <Badge variant="secondary">📵 No Answer</Badge>;
      case "left_voicemail":
        return <Badge variant="secondary">📞 Voicemail</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No Activities Yet</h3>
        <p className="text-sm text-muted-foreground">
          Start tracking interactions by logging calls, emails, or meetings.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {activities.map((activity: any, index: number) => (
          <div key={activity.id} className="flex gap-4 relative">
            {/* Timeline Line */}
            {index < activities.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border"></div>
            )}

            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center relative z-10">
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="font-semibold text-sm">
                    {activity.subject ||
                      activity.type.charAt(0).toUpperCase() +
                        activity.type.slice(1)}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(activity.createdAt),
                      "MMM d, yyyy • h:mm a",
                    )}
                  </p>
                </div>
                {getOutcomeBadge(activity.outcome)}
              </div>
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {activity.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Modern UI Helpers
const sparklineData = [
  { value: 400 },
  { value: 300 },
  { value: 600 },
  { value: 800 },
  { value: 500 },
  { value: 900 },
  { value: 1000 },
];

const PipelineCard = ({
  title,
  value,
  change,
  trend,
  color,
  icon: Icon,
  score,
  timeframe = "This week",
}: any) => (
  <Card className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all">
    <CardContent className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            <span
              className={`text-xs font-medium ${trend === "up" ? "text-emerald-600" : "text-slate-500"}`}
            >
              {trend === "up" && /^\d/.test(String(change)) ? "+" : ""}
              {change} | {timeframe}
            </span>
          </div>
        </div>
        <div className="relative">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {score && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
              <div className="bg-emerald-500 text-[8px] text-white px-1 rounded-full font-bold">
                .{score}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={trend === "up" ? "#10b981" : "#6366f1"}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export default function LeadsPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState<
    "call" | "email" | "sms" | "meeting" | "note"
  >("call");
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
  const [newNeeds, setNewNeeds] = useState<string[]>([]);
  const [editNeeds, setEditNeeds] = useState<string[]>([]);

  // AI Copilot state
  const [isAiDraftDialogOpen, setIsAiDraftDialogOpen] = useState(false);
  const [aiDraftGoal, setAiDraftGoal] = useState("Introduce our services");
  const [aiDraftResult, setAiDraftResult] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  // New state for modern UI
  // Default to the table view (matches the desired CRM layout)
  const [viewMode, setViewMode] = useState<"card" | "list" | "kanban">("list");
  const [quickFilterStage, setQuickFilterStage] = useState<string | null>(null);
  const [quickFilterScore, setQuickFilterScore] = useState<string | null>(null);
  const [quickFilterSource, setQuickFilterSource] = useState<string | null>(
    null,
  );
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [mobileLead, setMobileLead] = useState<Lead | null>(null);

  const {
    data: leads = [],
    isLoading,
    refetch,
  } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Allow deep-linking from the global help/search bar:
  // /leads?leadId=<id> will auto-open that lead.
  useEffect(() => {
    try {
      if (!leads?.length) return;
      const params = new URLSearchParams(window.location.search);
      const leadId = params.get("leadId");
      if (!leadId) return;
      const found = leads.find((l) => l.id === leadId);
      if (found) {
        setSelectedLead(found);
      }
    } catch {}
  }, [leads]);

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
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InsertLead>;
    }) => {
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
        variant: "destructive",
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
        description: "The lead has been permanently removed",
      });
      setSelectedLead(null);
      setLeadToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete lead",
        description: error?.message,
        variant: "destructive",
      });
      setLeadToDelete(null);
    },
  });

  const bulkDeleteLeadsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(
        ids.map((id) => apiRequest("DELETE", `/api/leads/${id}`)),
      );
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: `🗑️ ${ids.length} leads deleted`,
        description: "The selected leads have been permanently removed",
      });
      setSelectedLeads(new Set());
      setShowBulkActions(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete leads",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        `/api/leads/${data.leadId}/activities`,
        data,
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/leads/${variables.leadId}/activities`],
      });
      toast({
        title: "✅ Activity Logged",
        description: `${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} activity has been recorded`,
      });
      setIsActivityDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log activity",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async ({
      leadId,
      clientData,
    }: {
      leadId: string;
      clientData: any;
    }) => {
      // First, create the client
      const clientResponse = await apiRequest(
        "POST",
        "/api/clients",
        clientData,
      );
      const client = await clientResponse.json();

      // Then, update the lead to link to the client
      await apiRequest("PATCH", `/api/leads/${leadId}`, {
        convertedToClientId: client.id,
        convertedAt: new Date().toISOString(),
      });

      return client;
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "✅ Lead converted to client!",
        description: `${client.name} is now a client.`,
      });
      setIsConvertDialogOpen(false);
      setConvertingLead(null);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to convert lead",
        description: error?.message,
        variant: "destructive",
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
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
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
      formData.append("file", file);
      const response = await apiRequest(
        "POST",
        "/api/leads/parse-file",
        formData,
      );
      return response.json();
    },
    onSuccess: (data) => {
      setParsedLeads(data.leads || []);
      toast({
        title: `✅ Found ${data.leads?.length || 0} leads`,
        description: "Review and confirm to import",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to parse file",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const bulkImportLeadsMutation = useMutation({
    mutationFn: async (leads: any[]) => {
      const response = await apiRequest("POST", "/api/leads/bulk-import", {
        leads,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: `🎉 ${data.imported || 0} leads imported successfully!`,
        description: data.skipped
          ? `${data.skipped} duplicates skipped`
          : undefined,
      });
      setIsImportDialogOpen(false);
      setImportFile(null);
      setParsedLeads([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to import leads",
        description: error?.message,
        variant: "destructive",
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

  const aiAnalyzeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(
        "POST",
        `/api/leads/${id}/ai-analyze`,
        {},
      );
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "🧠 AI Analysis Complete",
        description: `Lead score: ${data.score}, Industry: ${data.industry}`,
      });
      if (selectedLead?.id === data.id) setSelectedLead(data);
    },
    onError: (error: any) => {
      toast({
        title: "AI Analysis Failed",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const aiDraftOutreachMutation = useMutation({
    mutationFn: async ({ id, goal }: { id: string; goal: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/leads/${id}/draft-outreach`,
        { goal },
      );
      return response.json();
    },
    onSuccess: (data) => {
      setAiDraftResult(data.draft);
      setIsDrafting(false);
    },
    onError: (error: any) => {
      setIsDrafting(false);
      toast({
        title: "AI Drafting Failed",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const sendPaymentLinkMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/leads/${leadId}/payment-link`,
        undefined,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate payment link");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast({
          title: "🚀 Payment Link Generated!",
          description:
            "The payment link has been generated and opened in a new tab. You can now copy and share it with the lead.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate link",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      (lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        lead.company?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === "all" || lead.stage === filterStatus;
    const matchesIndustry =
      filterIndustry === "all" ||
      !filterIndustry ||
      lead.industry?.toLowerCase() === filterIndustry.toLowerCase();

    // Quick filters
    const matchesQuickStage =
      !quickFilterStage || lead.stage === quickFilterStage;
    const matchesQuickScore =
      !quickFilterScore || lead.score === quickFilterScore;
    const matchesQuickSource =
      !quickFilterSource ||
      (quickFilterSource === "website_form"
        ? ["website", "website_form"].includes(lead.source || "")
        : lead.source === quickFilterSource);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesIndustry &&
      matchesQuickStage &&
      matchesQuickScore &&
      matchesQuickSource
    );
  });

  const leadStats = {
    total: leads.length,
    new: leads.filter((l) => l.stage === "prospect" || l.stage === "new")
      .length,
    prospect: leads.filter((l) => l.stage === "prospect").length,
    contacted: leads.filter((l) => l.stage === "contacted").length,
    qualified: leads.filter((l) => l.stage === "qualified").length,
    proposal: leads.filter((l) => l.stage === "proposal").length,
    converted: leads.filter(
      (l) => l.stage === "closed_won" || l.stage === "converted",
    ).length,
    closedWon: leads.filter((l) => l.stage === "closed_won").length,
    lost: leads.filter((l) => l.stage === "closed_lost" || l.stage === "lost")
      .length,
    closedLost: leads.filter((l) => l.stage === "closed_lost").length,
    // Temperature stats
    hot: leads.filter((l) => l.score === "hot").length,
    warm: leads.filter((l) => l.score === "warm").length,
    cold: leads.filter((l) => l.score === "cold").length,
    website: leads.filter((l) =>
      ["website", "website_form"].includes(l.source || ""),
    ).length,
    referral: leads.filter((l) => l.source === "referral").length,
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
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Compact Sticky Header - Fixed at top with blur effect */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Leads
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Track your sales pipeline
              </p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hidden lg:flex"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = "/lead-import-template.csv";
                  link.download = "lead-import-template.csv";
                  link.click();
                }}
              >
                <Download className="w-4 h-4" />
                Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 px-3"
                onClick={() => setIsImportDialogOpen(true)}
              >
                <Upload className="w-3.5 h-3.5 md:w-4 h-4" />
                <span className="hidden sm:inline text-xs md:text-sm">
                  Import
                </span>
              </Button>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 h-9 px-3 shadow-sm">
                    <UserPlus className="w-3.5 h-3.5 md:w-4 h-4" />
                    <span className="hidden sm:inline text-xs md:text-sm">
                      Add Lead
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
                  <div className="flex flex-col h-full max-h-[85vh]">
                    <DialogHeader className="px-6 pt-6 pb-4">
                      <DialogTitle>Add New Lead</DialogTitle>
                      <DialogDescription>
                        Create a new lead in your pipeline (Company name is
                        required)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 px-6">
                      <form
                        id="add-lead-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data: InsertLead = {
                            name: (formData.get("name") as string) || null,
                            email: (formData.get("email") as string) || null,
                            phone: (formData.get("phone") as string) || null,
                            phoneType:
                              (formData.get("phoneType") as string) ||
                              "business",
                            company: formData.get("company") as string,
                            location:
                              (formData.get("location") as string) || null,
                            website:
                              (formData.get("website") as string) || null,
                            // Social media links
                            instagram:
                              (formData.get("instagram") as string) || null,
                            tiktok: (formData.get("tiktok") as string) || null,
                            facebook:
                              (formData.get("facebook") as string) || null,
                            youtube:
                              (formData.get("youtube") as string) || null,
                            googleBusinessProfile:
                              (formData.get(
                                "googleBusinessProfile",
                              ) as string) || null,
                            rating: formData.get("rating")
                              ? parseInt(formData.get("rating") as string)
                              : null,
                            industry:
                              (formData.get("industry") as string) || null,
                            tags: newTags,
                            stage: formData.get("stage") as string,
                            score: formData.get("score") as string,
                            source: formData.get("source") as string,
                            needs: newNeeds,
                            status: formData.get("status") as string,
                            value: formData.get("value")
                              ? parseInt(formData.get("value") as string) * 100
                              : null, // Convert to cents
                            notes: (formData.get("notes") as string) || null,
                            // Contact tracking fields
                            contactStatus:
                              (formData.get("contactStatus") as string) ||
                              "not_contacted",
                            lastContactMethod:
                              (formData.get("lastContactMethod") as string) ||
                              null,
                            lastContactDate: null, // Will be set when activity is logged
                            lastContactNotes: null,
                            nextFollowUpType:
                              (formData.get("nextFollowUpType") as string) ||
                              null,
                            nextFollowUpDate: formData.get("nextFollowUpDate")
                              ? new Date(
                                  formData.get("nextFollowUpDate") as string,
                                )
                              : null,
                            clientId: null,
                            assignedToId: null,
                            sourceMetadata: null,
                            nextFollowUp: null,
                            expectedCloseDate: null,
                            expectedStartDate: null,
                          };
                          createLeadMutation.mutate(data);
                          setNewTags([]); // Reset tags after submission
                          setNewNeeds([]); // Reset needs after submission
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input name="name" placeholder="John Doe" />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              name="email"
                              type="email"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Phone</Label>
                            <div className="flex gap-2">
                              <Input
                                name="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                className="flex-1"
                              />
                              <Select name="phoneType" defaultValue="business">
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="business">
                                    💼 Business
                                  </SelectItem>
                                  <SelectItem value="personal">
                                    👤 Personal
                                  </SelectItem>
                                  <SelectItem value="mobile">
                                    📱 Mobile
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>Company *</Label>
                            <Input
                              name="company"
                              placeholder="Acme Inc"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Location</Label>
                            <Input name="location" placeholder="New York, NY" />
                          </div>
                          <div>
                            <Label>Website</Label>
                            <Input
                              name="website"
                              type="url"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label>Lead Value ($)</Label>
                            <Input
                              name="value"
                              type="number"
                              placeholder="5000"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">
                            Social Media Links
                          </Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Instagram Link
                              </Label>
                              <Input
                                name="instagram"
                                type="url"
                                placeholder="https://instagram.com/..."
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Facebook Link
                              </Label>
                              <Input
                                name="facebook"
                                type="url"
                                placeholder="https://facebook.com/..."
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                TikTok Link
                              </Label>
                              <Input
                                name="tiktok"
                                type="url"
                                placeholder="https://tiktok.com/@..."
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                YouTube Link
                              </Label>
                              <Input
                                name="youtube"
                                type="url"
                                placeholder="https://youtube.com/@..."
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Google Business Profile
                              </Label>
                              <Input
                                name="googleBusinessProfile"
                                type="url"
                                placeholder="https://g.page/..."
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Business Rating (1-5)</Label>
                            <Input
                              name="rating"
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              placeholder="4.5"
                            />
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
                                <SelectItem value="technology">
                                  💻 Technology
                                </SelectItem>
                                <SelectItem value="healthcare">
                                  🏥 Healthcare
                                </SelectItem>
                                <SelectItem value="finance">
                                  🏦 Finance
                                </SelectItem>
                                <SelectItem value="retail">
                                  🛒 Retail
                                </SelectItem>
                                <SelectItem value="construction">
                                  🏗️ Construction
                                </SelectItem>
                                <SelectItem value="education">
                                  📚 Education
                                </SelectItem>
                                <SelectItem value="manufacturing">
                                  🏭 Manufacturing
                                </SelectItem>
                                <SelectItem value="real_estate">
                                  🏠 Real Estate
                                </SelectItem>
                                <SelectItem value="hospitality">
                                  🏨 Hospitality
                                </SelectItem>
                                <SelectItem value="restaurant">
                                  🍽️ Restaurant
                                </SelectItem>
                                <SelectItem value="media">
                                  📺 Media & Entertainment
                                </SelectItem>
                                <SelectItem value="legal">⚖️ Legal</SelectItem>
                                <SelectItem value="consulting">
                                  💼 Consulting
                                </SelectItem>
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
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (
                                      newTagInput.trim() &&
                                      !newTags.includes(newTagInput.trim())
                                    ) {
                                      setNewTags([
                                        ...newTags,
                                        newTagInput.trim(),
                                      ]);
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
                                  if (
                                    newTagInput.trim() &&
                                    !newTags.includes(newTagInput.trim())
                                  ) {
                                    setNewTags([
                                      ...newTags,
                                      newTagInput.trim(),
                                    ]);
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
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="gap-1"
                                  >
                                    {tag}
                                    <X
                                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                                      onClick={() =>
                                        setNewTags(
                                          newTags.filter((t) => t !== tag),
                                        )
                                      }
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
                            <Select
                              name="stage"
                              defaultValue="prospect"
                              required
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="prospect">
                                  Prospect
                                </SelectItem>
                                <SelectItem value="qualified">
                                  Qualified
                                </SelectItem>
                                <SelectItem value="proposal">
                                  Proposal
                                </SelectItem>
                                <SelectItem value="closed_won">
                                  Closed Won
                                </SelectItem>
                                <SelectItem value="closed_lost">
                                  Closed Lost
                                </SelectItem>
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
                            <Select
                              name="source"
                              defaultValue="google_extract"
                              required
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="google_extract">
                                  🔍 Google Extract
                                </SelectItem>
                                <SelectItem value="instagram">
                                  📷 Instagram
                                </SelectItem>
                                <SelectItem value="facebook">
                                  📘 Facebook
                                </SelectItem>
                                <SelectItem value="website_form">
                                  📝 Website Form
                                </SelectItem>
                                <SelectItem value="referral">
                                  👥 Referral
                                </SelectItem>
                                <SelectItem value="tiktok">
                                  🎵 TikTok
                                </SelectItem>
                                <SelectItem value="other">📦 Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Needs Checklist */}
                        <div className="space-y-3 pt-4 border-t">
                          <Label className="text-sm font-semibold">
                            What does this business need?
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-social"
                                checked={newNeeds.includes("social_media")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([...newNeeds, "social_media"]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter(
                                        (n) => n !== "social_media",
                                      ),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-social"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Needs Social Media Management
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-content"
                                checked={newNeeds.includes("content")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([...newNeeds, "content"]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter((n) => n !== "content"),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-content"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Needs Content Creation
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-website"
                                checked={newNeeds.includes("website")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([...newNeeds, "website"]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter((n) => n !== "website"),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-website"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Needs Website
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-ads"
                                checked={newNeeds.includes("ads")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([...newNeeds, "ads"]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter((n) => n !== "ads"),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-ads"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Needs Paid Ads
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-branding"
                                checked={newNeeds.includes("branding")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([...newNeeds, "branding"]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter((n) => n !== "branding"),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-branding"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Needs Branding
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-google"
                                checked={newNeeds.includes(
                                  "google_optimization",
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([
                                      ...newNeeds,
                                      "google_optimization",
                                    ]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter(
                                        (n) => n !== "google_optimization",
                                      ),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-google"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Needs Google Optimization
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-crm"
                                checked={newNeeds.includes("crm")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([...newNeeds, "crm"]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter((n) => n !== "crm"),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-crm"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Needs CRM/Automation
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="needs-unsure"
                                checked={newNeeds.includes("not_sure")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewNeeds([...newNeeds, "not_sure"]);
                                  } else {
                                    setNewNeeds(
                                      newNeeds.filter((n) => n !== "not_sure"),
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor="needs-unsure"
                                className="text-sm font-normal cursor-pointer"
                              >
                                Not Sure
                              </Label>
                            </div>
                          </div>
                        </div>

                        {/* Status Dropdown */}
                        <div className="pt-4 border-t">
                          <Label>Status *</Label>
                          <Select
                            name="status"
                            defaultValue="research_completed"
                            required
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="research_completed">
                                ✅ Research Completed
                              </SelectItem>
                              <SelectItem value="missing_info">
                                ⚠️ Missing Information
                              </SelectItem>
                              <SelectItem value="needs_review">
                                👀 Needs Review by Bobby
                              </SelectItem>
                              <SelectItem value="ready_for_outreach">
                                🚀 Ready for Outreach
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Contact Tracking Section */}
                        <div className="space-y-4 pt-4 border-t">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            📞 Contact Tracking
                          </h3>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Contact Status</Label>
                              <Select
                                name="contactStatus"
                                defaultValue="not_contacted"
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_contacted">
                                    ⚫ Not Contacted
                                  </SelectItem>
                                  <SelectItem value="contacted">
                                    🟢 Contacted
                                  </SelectItem>
                                  <SelectItem value="in_discussion">
                                    🔵 In Discussion
                                  </SelectItem>
                                  <SelectItem value="proposal_sent">
                                    🟡 Proposal Sent
                                  </SelectItem>
                                  <SelectItem value="follow_up_needed">
                                    🟠 Follow-up Needed
                                  </SelectItem>
                                  <SelectItem value="no_response">
                                    🔴 No Response
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Last Contact Method</Label>
                              <Select name="lastContactMethod">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">
                                    📧 Email
                                  </SelectItem>
                                  <SelectItem value="sms">💬 SMS</SelectItem>
                                  <SelectItem value="call">
                                    📞 Phone Call
                                  </SelectItem>
                                  <SelectItem value="meeting">
                                    🤝 Meeting
                                  </SelectItem>
                                  <SelectItem value="social">
                                    📱 Social Media
                                  </SelectItem>
                                  <SelectItem value="other">
                                    📋 Other
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Next Follow-up Type</Label>
                              <Select name="nextFollowUpType">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="call">📞 Call</SelectItem>
                                  <SelectItem value="email">
                                    📧 Email
                                  </SelectItem>
                                  <SelectItem value="meeting">
                                    🤝 Meeting
                                  </SelectItem>
                                  <SelectItem value="proposal">
                                    📄 Send Proposal
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Next Follow-up Date</Label>
                              <Input
                                name="nextFollowUpDate"
                                type="datetime-local"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            name="notes"
                            placeholder="Additional information about this lead..."
                            rows={3}
                          />
                        </div>
                      </form>
                    </div>

                    <div className="border-t px-6 py-4 flex justify-end gap-2 bg-background">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        form="add-lead-form"
                        disabled={createLeadMutation.isPending}
                      >
                        {createLeadMutation.isPending
                          ? "Creating..."
                          : "Create Lead"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Lead Dialog */}
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
                  <div className="flex flex-col h-full max-h-[85vh]">
                    <DialogHeader className="px-6 pt-6 pb-4">
                      <DialogTitle>Edit Lead</DialogTitle>
                      <DialogDescription>
                        Update lead information
                      </DialogDescription>
                    </DialogHeader>
                    {editingLead && (
                      <>
                        <div className="overflow-y-auto flex-1 px-6">
                          <form
                            id="edit-lead-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const data: Partial<InsertLead> = {
                                name: (formData.get("name") as string) || null,
                                email:
                                  (formData.get("email") as string) || null,
                                phone:
                                  (formData.get("phone") as string) || null,
                                phoneType:
                                  (formData.get("phoneType") as string) ||
                                  "business",
                                company: formData.get("company") as string,
                                location:
                                  (formData.get("location") as string) || null,
                                website:
                                  (formData.get("website") as string) || null,
                                // Social media links
                                instagram:
                                  (formData.get("instagram") as string) || null,
                                tiktok:
                                  (formData.get("tiktok") as string) || null,
                                facebook:
                                  (formData.get("facebook") as string) || null,
                                youtube:
                                  (formData.get("youtube") as string) || null,
                                googleBusinessProfile:
                                  (formData.get(
                                    "googleBusinessProfile",
                                  ) as string) || null,
                                rating: formData.get("rating")
                                  ? parseInt(formData.get("rating") as string)
                                  : null,
                                industry:
                                  (formData.get("industry") as string) || null,
                                tags: editTags,
                                stage: formData.get("stage") as string,
                                score: formData.get("score") as string,
                                source: formData.get("source") as string,
                                needs: editNeeds,
                                status: formData.get("status") as string,
                                value: formData.get("value")
                                  ? parseInt(formData.get("value") as string) *
                                    100
                                  : null,
                                notes:
                                  (formData.get("notes") as string) || null,
                                // Contact tracking fields
                                contactStatus:
                                  (formData.get("contactStatus") as string) ||
                                  "not_contacted",
                                lastContactMethod:
                                  (formData.get(
                                    "lastContactMethod",
                                  ) as string) || null,
                                nextFollowUpType:
                                  (formData.get(
                                    "nextFollowUpType",
                                  ) as string) || null,
                                nextFollowUpDate: formData.get(
                                  "nextFollowUpDate",
                                )
                                  ? new Date(
                                      formData.get(
                                        "nextFollowUpDate",
                                      ) as string,
                                    )
                                  : null,
                              };
                              updateLeadMutation.mutate({
                                id: editingLead.id,
                                data,
                              });
                            }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  name="name"
                                  defaultValue={editingLead.name || ""}
                                  placeholder="John Doe"
                                />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input
                                  name="email"
                                  type="email"
                                  defaultValue={editingLead.email || ""}
                                  placeholder="john@example.com"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Phone</Label>
                                <div className="flex gap-2">
                                  <Input
                                    name="phone"
                                    type="tel"
                                    defaultValue={editingLead.phone || ""}
                                    placeholder="+1 (555) 123-4567"
                                    className="flex-1"
                                  />
                                  <Select
                                    name="phoneType"
                                    defaultValue={
                                      editingLead.phoneType || "business"
                                    }
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="business">
                                        💼 Business
                                      </SelectItem>
                                      <SelectItem value="personal">
                                        👤 Personal
                                      </SelectItem>
                                      <SelectItem value="mobile">
                                        📱 Mobile
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label>Company *</Label>
                                <Input
                                  name="company"
                                  defaultValue={editingLead.company || ""}
                                  placeholder="Acme Inc"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Location</Label>
                                <Input
                                  name="location"
                                  defaultValue={editingLead.location || ""}
                                  placeholder="New York, NY"
                                />
                              </div>
                              <div>
                                <Label>Website</Label>
                                <Input
                                  name="website"
                                  type="url"
                                  defaultValue={editingLead.website || ""}
                                  placeholder="https://example.com"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label>Lead Value ($)</Label>
                                <Input
                                  name="value"
                                  type="number"
                                  defaultValue={
                                    editingLead.value
                                      ? editingLead.value / 100
                                      : ""
                                  }
                                  placeholder="5000"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">
                                Social Media Links
                              </Label>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Instagram Link
                                  </Label>
                                  <Input
                                    name="instagram"
                                    type="url"
                                    defaultValue={editingLead.instagram || ""}
                                    placeholder="https://instagram.com/..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Facebook Link
                                  </Label>
                                  <Input
                                    name="facebook"
                                    type="url"
                                    defaultValue={editingLead.facebook || ""}
                                    placeholder="https://facebook.com/..."
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    TikTok Link
                                  </Label>
                                  <Input
                                    name="tiktok"
                                    type="url"
                                    defaultValue={editingLead.tiktok || ""}
                                    placeholder="https://tiktok.com/@..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    YouTube Link
                                  </Label>
                                  <Input
                                    name="youtube"
                                    type="url"
                                    defaultValue={editingLead.youtube || ""}
                                    placeholder="https://youtube.com/@..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Google Business Profile
                                  </Label>
                                  <Input
                                    name="googleBusinessProfile"
                                    type="url"
                                    defaultValue={
                                      editingLead.googleBusinessProfile || ""
                                    }
                                    placeholder="https://g.page/..."
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Business Rating (1-5)</Label>
                                <Input
                                  name="rating"
                                  type="number"
                                  min="1"
                                  max="5"
                                  step="0.1"
                                  defaultValue={editingLead.rating || ""}
                                  placeholder="4.5"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Industry</Label>
                                <Select
                                  name="industry"
                                  defaultValue={editingLead.industry || ""}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="technology">
                                      💻 Technology
                                    </SelectItem>
                                    <SelectItem value="healthcare">
                                      🏥 Healthcare
                                    </SelectItem>
                                    <SelectItem value="finance">
                                      🏦 Finance
                                    </SelectItem>
                                    <SelectItem value="retail">
                                      🛒 Retail
                                    </SelectItem>
                                    <SelectItem value="construction">
                                      🏗️ Construction
                                    </SelectItem>
                                    <SelectItem value="education">
                                      📚 Education
                                    </SelectItem>
                                    <SelectItem value="manufacturing">
                                      🏭 Manufacturing
                                    </SelectItem>
                                    <SelectItem value="real_estate">
                                      🏠 Real Estate
                                    </SelectItem>
                                    <SelectItem value="hospitality">
                                      🏨 Hospitality
                                    </SelectItem>
                                    <SelectItem value="restaurant">
                                      🍽️ Restaurant
                                    </SelectItem>
                                    <SelectItem value="media">
                                      📺 Media & Entertainment
                                    </SelectItem>
                                    <SelectItem value="legal">
                                      ⚖️ Legal
                                    </SelectItem>
                                    <SelectItem value="consulting">
                                      💼 Consulting
                                    </SelectItem>
                                    <SelectItem value="other">
                                      🏢 Other
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Tags</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={newTagInput}
                                    onChange={(e) =>
                                      setNewTagInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (
                                          newTagInput.trim() &&
                                          !editTags.includes(newTagInput.trim())
                                        ) {
                                          setEditTags([
                                            ...editTags,
                                            newTagInput.trim(),
                                          ]);
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
                                      if (
                                        newTagInput.trim() &&
                                        !editTags.includes(newTagInput.trim())
                                      ) {
                                        setEditTags([
                                          ...editTags,
                                          newTagInput.trim(),
                                        ]);
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
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="gap-1"
                                      >
                                        {tag}
                                        <X
                                          className="w-3 h-3 cursor-pointer hover:text-destructive"
                                          onClick={() =>
                                            setEditTags(
                                              editTags.filter((t) => t !== tag),
                                            )
                                          }
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
                                <Select
                                  name="stage"
                                  defaultValue={editingLead.stage}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="prospect">
                                      Prospect
                                    </SelectItem>
                                    <SelectItem value="qualified">
                                      Qualified
                                    </SelectItem>
                                    <SelectItem value="proposal">
                                      Proposal
                                    </SelectItem>
                                    <SelectItem value="closed_won">
                                      Closed Won
                                    </SelectItem>
                                    <SelectItem value="closed_lost">
                                      Closed Lost
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Temperature *</Label>
                                <Select
                                  name="score"
                                  defaultValue={editingLead.score || "warm"}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hot">🔥 Hot</SelectItem>
                                    <SelectItem value="warm">
                                      ☀️ Warm
                                    </SelectItem>
                                    <SelectItem value="cold">
                                      ❄️ Cold
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Lead Source *</Label>
                                <Select
                                  name="source"
                                  defaultValue={editingLead.source}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="google_extract">
                                      🔍 Google Extract
                                    </SelectItem>
                                    <SelectItem value="instagram">
                                      📷 Instagram
                                    </SelectItem>
                                    <SelectItem value="facebook">
                                      📘 Facebook
                                    </SelectItem>
                                    <SelectItem value="website_form">
                                      📝 Website Form
                                    </SelectItem>
                                    <SelectItem value="referral">
                                      👥 Referral
                                    </SelectItem>
                                    <SelectItem value="tiktok">
                                      🎵 TikTok
                                    </SelectItem>
                                    <SelectItem value="other">
                                      📦 Other
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Needs Checklist */}
                            <div className="space-y-3 pt-4 border-t">
                              <Label className="text-sm font-semibold">
                                What does this business need?
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-social"
                                    checked={editNeeds.includes("social_media")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([
                                          ...editNeeds,
                                          "social_media",
                                        ]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter(
                                            (n) => n !== "social_media",
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-social"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Needs Social Media Management
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-content"
                                    checked={editNeeds.includes("content")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([...editNeeds, "content"]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter(
                                            (n) => n !== "content",
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-content"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Needs Content Creation
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-website"
                                    checked={editNeeds.includes("website")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([...editNeeds, "website"]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter(
                                            (n) => n !== "website",
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-website"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Needs Website
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-ads"
                                    checked={editNeeds.includes("ads")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([...editNeeds, "ads"]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter((n) => n !== "ads"),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-ads"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Needs Paid Ads
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-branding"
                                    checked={editNeeds.includes("branding")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([
                                          ...editNeeds,
                                          "branding",
                                        ]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter(
                                            (n) => n !== "branding",
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-branding"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Needs Branding
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-google"
                                    checked={editNeeds.includes(
                                      "google_optimization",
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([
                                          ...editNeeds,
                                          "google_optimization",
                                        ]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter(
                                            (n) => n !== "google_optimization",
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-google"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Needs Google Optimization
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-crm"
                                    checked={editNeeds.includes("crm")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([...editNeeds, "crm"]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter((n) => n !== "crm"),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-crm"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Needs CRM/Automation
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-needs-unsure"
                                    checked={editNeeds.includes("not_sure")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditNeeds([
                                          ...editNeeds,
                                          "not_sure",
                                        ]);
                                      } else {
                                        setEditNeeds(
                                          editNeeds.filter(
                                            (n) => n !== "not_sure",
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor="edit-needs-unsure"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Not Sure
                                  </Label>
                                </div>
                              </div>
                            </div>

                            {/* Status Dropdown */}
                            <div className="pt-4 border-t">
                              <Label>Status *</Label>
                              <Select
                                name="status"
                                defaultValue={
                                  editingLead.status || "research_completed"
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="research_completed">
                                    ✅ Research Completed
                                  </SelectItem>
                                  <SelectItem value="missing_info">
                                    ⚠️ Missing Information
                                  </SelectItem>
                                  <SelectItem value="needs_review">
                                    👀 Needs Review by Bobby
                                  </SelectItem>
                                  <SelectItem value="ready_for_outreach">
                                    🚀 Ready for Outreach
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Contact Tracking Section */}
                            <div className="space-y-4 pt-4 border-t">
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                📞 Contact Tracking
                              </h3>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Contact Status</Label>
                                  <Select
                                    name="contactStatus"
                                    defaultValue={
                                      editingLead.contactStatus ||
                                      "not_contacted"
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not_contacted">
                                        ⚫ Not Contacted
                                      </SelectItem>
                                      <SelectItem value="contacted">
                                        🟢 Contacted
                                      </SelectItem>
                                      <SelectItem value="in_discussion">
                                        🔵 In Discussion
                                      </SelectItem>
                                      <SelectItem value="proposal_sent">
                                        🟡 Proposal Sent
                                      </SelectItem>
                                      <SelectItem value="follow_up_needed">
                                        🟠 Follow-up Needed
                                      </SelectItem>
                                      <SelectItem value="no_response">
                                        🔴 No Response
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Last Contact Method</Label>
                                  <Select
                                    name="lastContactMethod"
                                    defaultValue={
                                      editingLead.lastContactMethod || ""
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="email">
                                        📧 Email
                                      </SelectItem>
                                      <SelectItem value="sms">
                                        💬 SMS
                                      </SelectItem>
                                      <SelectItem value="call">
                                        📞 Phone Call
                                      </SelectItem>
                                      <SelectItem value="meeting">
                                        🤝 Meeting
                                      </SelectItem>
                                      <SelectItem value="social">
                                        📱 Social Media
                                      </SelectItem>
                                      <SelectItem value="other">
                                        📋 Other
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Next Follow-up Type</Label>
                                  <Select
                                    name="nextFollowUpType"
                                    defaultValue={
                                      editingLead.nextFollowUpType || ""
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="call">
                                        📞 Call
                                      </SelectItem>
                                      <SelectItem value="email">
                                        📧 Email
                                      </SelectItem>
                                      <SelectItem value="meeting">
                                        🤝 Meeting
                                      </SelectItem>
                                      <SelectItem value="proposal">
                                        📄 Send Proposal
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Next Follow-up Date</Label>
                                  <Input
                                    name="nextFollowUpDate"
                                    type="datetime-local"
                                    defaultValue={
                                      editingLead.nextFollowUpDate
                                        ? new Date(
                                            editingLead.nextFollowUpDate as any,
                                          )
                                            .toISOString()
                                            .slice(0, 16)
                                        : ""
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label>Notes</Label>
                              <Textarea
                                name="notes"
                                defaultValue={editingLead.notes || ""}
                                placeholder="Additional information about this lead..."
                                rows={3}
                              />
                            </div>
                          </form>
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end gap-2 bg-background">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditDialogOpen(false);
                              setEditingLead(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            form="edit-lead-form"
                            disabled={updateLeadMutation.isPending}
                          >
                            {updateLeadMutation.isPending
                              ? "Updating..."
                              : "Update Lead"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Convert to Client Dialog */}
              <Dialog
                open={isConvertDialogOpen}
                onOpenChange={setIsConvertDialogOpen}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      Convert Lead to Client
                    </DialogTitle>
                    <DialogDescription>
                      Review and confirm the client information below. This will
                      create a new client and mark the lead as converted.
                    </DialogDescription>
                  </DialogHeader>
                  {convertingLead && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const clientData = {
                          name: formData.get("name") as string,
                          email: (formData.get("email") as string) || null,
                          phone: (formData.get("phone") as string) || null,
                          company: (formData.get("company") as string) || null,
                          website: (formData.get("website") as string) || null,
                          status:
                            (formData.get("status") as string) || "onboarding",
                          notes: (formData.get("notes") as string) || null,
                        };
                        convertToClientMutation.mutate({
                          leadId: convertingLead.id,
                          clientData,
                        });
                      }}
                      className="space-y-4"
                    >
                      {/* Success Banner */}
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                              🎉 Lead Won!
                            </h4>
                            <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
                              Convert{" "}
                              <strong>
                                {convertingLead.company || convertingLead.name}
                              </strong>{" "}
                              to a client to start managing projects, invoices,
                              and content.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Client Name *</Label>
                          <Input
                            name="name"
                            defaultValue={
                              convertingLead.company ||
                              convertingLead.name ||
                              ""
                            }
                            placeholder="Client name"
                            required
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            name="company"
                            defaultValue={convertingLead.company || ""}
                            placeholder="Company name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <Input
                            name="email"
                            type="email"
                            defaultValue={convertingLead.email || ""}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            name="phone"
                            type="tel"
                            defaultValue={convertingLead.phone || ""}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Website</Label>
                        <Input
                          name="website"
                          type="url"
                          defaultValue={convertingLead.website || ""}
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <Label>Initial Status</Label>
                        <Select name="status" defaultValue="onboarding">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="onboarding">
                              🚀 Onboarding
                            </SelectItem>
                            <SelectItem value="active">✅ Active</SelectItem>
                            <SelectItem value="inactive">
                              💤 Inactive
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          name="notes"
                          defaultValue={
                            convertingLead.notes ||
                            `Converted from lead.\nOriginal lead value: $${convertingLead.value ? (convertingLead.value / 100).toFixed(2) : "0.00"}`
                          }
                          placeholder="Additional notes about this client..."
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsConvertDialogOpen(false);
                            setConvertingLead(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={convertToClientMutation.isPending}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                        >
                          {convertToClientMutation.isPending ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Converting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Create Client
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              {/* Log Activity Dialog */}
              <Dialog
                open={isActivityDialogOpen}
                onOpenChange={setIsActivityDialogOpen}
              >
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {activityType === "call" && (
                        <PhoneCall className="w-5 h-5 text-blue-600" />
                      )}
                      {activityType === "email" && (
                        <Mail className="w-5 h-5 text-purple-600" />
                      )}
                      {activityType === "sms" && (
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      )}
                      {activityType === "meeting" && (
                        <Calendar className="w-5 h-5 text-orange-600" />
                      )}
                      {activityType === "note" && (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                      Log{" "}
                      {activityType.charAt(0).toUpperCase() +
                        activityType.slice(1)}
                    </DialogTitle>
                    <DialogDescription>
                      Record a {activityType} activity for{" "}
                      {selectedLead?.company || selectedLead?.name}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedLead && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = {
                          leadId: selectedLead.id,
                          type: activityType,
                          subject: (formData.get("subject") as string) || null,
                          description: formData.get("description") as string,
                          outcome: (formData.get("outcome") as string) || null,
                        };
                        logActivityMutation.mutate(data);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label>Subject</Label>
                        <Input
                          name="subject"
                          placeholder={
                            activityType === "call"
                              ? "e.g., Discovery call"
                              : activityType === "email"
                                ? "e.g., Proposal sent"
                                : activityType === "sms"
                                  ? "e.g., Follow-up text"
                                  : activityType === "meeting"
                                    ? "e.g., Initial consultation"
                                    : "e.g., General note"
                          }
                        />
                      </div>

                      <div>
                        <Label>Description *</Label>
                        <Textarea
                          name="description"
                          placeholder="What happened during this interaction?"
                          rows={4}
                          required
                        />
                      </div>

                      {(activityType === "call" ||
                        activityType === "email" ||
                        activityType === "sms" ||
                        activityType === "meeting") && (
                        <div>
                          <Label>Outcome</Label>
                          <Select name="outcome">
                            <SelectTrigger>
                              <SelectValue placeholder="Select outcome" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="positive">
                                ✅ Positive
                              </SelectItem>
                              <SelectItem value="neutral">
                                ➖ Neutral
                              </SelectItem>
                              <SelectItem value="negative">
                                ❌ Negative
                              </SelectItem>
                              {activityType === "call" && (
                                <>
                                  <SelectItem value="no_answer">
                                    📵 No Answer
                                  </SelectItem>
                                  <SelectItem value="left_voicemail">
                                    📞 Left Voicemail
                                  </SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsActivityDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={logActivityMutation.isPending}
                        >
                          {logActivityMutation.isPending
                            ? "Logging..."
                            : "Log Activity"}
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Lead Detail Dialog */}
          <Dialog
            open={!!selectedLead}
            onOpenChange={(open) => !open && setSelectedLead(null)}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              {selectedLead && (
                <>
                  <DialogHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <DialogTitle className="text-2xl">
                          {selectedLead.name}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={getStageBadge(selectedLead.stage) as any}
                          >
                            {selectedLead.stage.replace("_", " ")}
                          </Badge>
                          {selectedLead.score && (
                            <Badge
                              variant="outline"
                              className={`gap-1 ${
                                selectedLead.score === "hot"
                                  ? "border-red-500 text-red-700 bg-red-50"
                                  : selectedLead.score === "warm"
                                    ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                                    : "border-blue-500 text-blue-700 bg-blue-50"
                              }`}
                            >
                              {selectedLead.score === "hot" && "🔥"}
                              {selectedLead.score === "warm" && "☀️"}
                              {selectedLead.score === "cold" && "❄️"}
                              <span className="ml-1 capitalize">
                                {selectedLead.score} Lead
                              </span>
                            </Badge>
                          )}
                          {selectedLead.convertedToClientId && (
                            <Badge className="gap-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Converted to Client
                            </Badge>
                          )}
                        </DialogDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                          onClick={() => {
                            setIsAiDraftDialogOpen(true);
                            setAiDraftResult("");
                          }}
                        >
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          AI Draft
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() =>
                            aiAnalyzeMutation.mutate(selectedLead.id)
                          }
                          disabled={aiAnalyzeMutation.isPending}
                        >
                          <BrainCircuit
                            className={`w-4 h-4 text-blue-600 ${aiAnalyzeMutation.isPending ? "animate-pulse" : ""}`}
                          />
                          {aiAnalyzeMutation.isPending
                            ? "Analyzing..."
                            : "AI Analyze"}
                        </Button>
                      </div>
                    </div>
                  </DialogHeader>

                  <Tabs defaultValue="details" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="activity">
                        Activity Timeline
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6 mt-4">
                      {/* Contact Information */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3">
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedLead.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={`mailto:${selectedLead.email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {selectedLead.email}
                              </a>
                            </div>
                          )}
                          {selectedLead.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={`tel:${selectedLead.phone}`}
                                className="text-blue-600 hover:underline"
                              >
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
                              <a
                                href={selectedLead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Website
                              </a>
                            </div>
                          )}
                          {selectedLead.instagram && (
                            <div className="flex items-center gap-2">
                              <Instagram className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={selectedLead.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Instagram
                              </a>
                            </div>
                          )}
                          {selectedLead.tiktok && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={selectedLead.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                TikTok
                              </a>
                            </div>
                          )}
                          {selectedLead.facebook && (
                            <div className="flex items-center gap-2">
                              <Facebook className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={selectedLead.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Facebook
                              </a>
                            </div>
                          )}
                          {selectedLead.googleBusinessProfile && (
                            <div className="flex items-center gap-2">
                              <MapPinned className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={selectedLead.googleBusinessProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Google Business
                              </a>
                            </div>
                          )}
                          {selectedLead.rating && (
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">
                                {selectedLead.rating} / 5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lead Details */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3">
                          Lead Details
                        </h3>
                        <div className="space-y-2">
                          {selectedLead.value && (
                            <div className="flex items-center justify-between py-2 border-b">
                              <span className="text-muted-foreground">
                                Potential Value
                              </span>
                              <span className="font-semibold">
                                ${(selectedLead.value / 100).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-muted-foreground">
                              Source
                            </span>
                            <span className="capitalize">
                              {selectedLead.source.replace("_", " ")}
                            </span>
                          </div>
                          {selectedLead.createdAt && (
                            <div className="flex items-center justify-between py-2 border-b">
                              <span className="text-muted-foreground">
                                Added
                              </span>
                              <span>
                                {format(
                                  new Date(selectedLead.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </span>
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
                                setLocation(
                                  `/phone?number=${encodeURIComponent(selectedLead.phone)}&action=call`,
                                );
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
                                setLocation(
                                  `/phone?number=${encodeURIComponent(selectedLead.phone)}&action=sms`,
                                );
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

                        {/* Convert to Client Button - Only show for closed_won leads that haven't been converted */}
                        {selectedLead.stage === "closed_won" &&
                          !selectedLead.convertedToClientId && (
                            <Button
                              onClick={() => {
                                setConvertingLead(selectedLead);
                                setIsConvertDialogOpen(true);
                                setSelectedLead(null);
                              }}
                              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Convert to Client
                            </Button>
                          )}

                        <Button
                          onClick={() => setLeadToDelete(selectedLead)}
                          variant="destructive"
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Lead
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="mt-4">
                      <LeadActivityTimeline leadId={selectedLead.id} />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {/* Modern Horizontal Filter Bar - Fixed below header with mobile optimization */}
        <div className="flex-shrink-0 border-b bg-muted/20 backdrop-blur-sm sticky top-[57px] md:top-[65px] z-10">
          <div className="px-4 md:px-6 py-2 md:py-3">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
              {/* Search */}
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  className="pl-10 h-10 md:h-9 bg-background/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters & View Toggle */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 md:h-9 min-w-[120px] md:w-[130px] bg-background/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="closed_won">Won</SelectItem>
                    <SelectItem value="closed_lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterIndustry}
                  onValueChange={setFilterIndustry}
                >
                  <SelectTrigger className="h-10 md:h-9 min-w-[120px] md:w-[130px] bg-background/50">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex border rounded-lg overflow-hidden shrink-0 ml-auto md:ml-0 bg-background/50">
                  <Button
                    variant={viewMode === "card" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                    className="rounded-none h-10 w-10 md:h-9 md:w-9 px-0"
                    title="Card view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none h-10 w-10 md:h-9 md:w-9 px-0"
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "kanban" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                    className="rounded-none h-10 w-10 md:h-9 md:w-9 px-0"
                    title="Kanban view"
                  >
                    <Columns3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Filter Chips - Horizontal Scroll on Mobile */}
            <div className="space-y-2 mt-2 md:mt-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x">
                <Badge
                  variant={
                    quickFilterStage === "prospect" ? "default" : "outline"
                  }
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs snap-start"
                  onClick={() =>
                    setQuickFilterStage((q) =>
                      q === "prospect" ? null : "prospect",
                    )
                  }
                >
                  🎯 Prospect ({leadStats.prospect})
                </Badge>
                <Badge
                  variant={
                    quickFilterStage === "qualified" ? "default" : "outline"
                  }
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs snap-start"
                  onClick={() =>
                    setQuickFilterStage((q) =>
                      q === "qualified" ? null : "qualified",
                    )
                  }
                >
                  ✅ Qualified ({leadStats.qualified})
                </Badge>
                <Badge
                  variant={
                    quickFilterScore === "hot" ? "destructive" : "outline"
                  }
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs snap-start"
                  onClick={() =>
                    setQuickFilterScore((q) => (q === "hot" ? null : "hot"))
                  }
                >
                  🔥 Hot ({leadStats.hot})
                </Badge>
                <Badge
                  variant={quickFilterScore === "warm" ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs snap-start"
                  onClick={() =>
                    setQuickFilterScore((q) => (q === "warm" ? null : "warm"))
                  }
                >
                  ☀️ Warm ({leadStats.warm})
                </Badge>
                <Badge
                  variant={
                    quickFilterScore === "cold" ? "secondary" : "outline"
                  }
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs snap-start"
                  onClick={() =>
                    setQuickFilterScore((q) => (q === "cold" ? null : "cold"))
                  }
                >
                  ❄️ Cold ({leadStats.cold})
                </Badge>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x">
                <Badge
                  variant={
                    quickFilterSource === "website_form" ? "default" : "outline"
                  }
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs snap-start"
                  onClick={() =>
                    setQuickFilterSource((q) =>
                      q === "website_form" ? null : "website_form",
                    )
                  }
                >
                  🌐 Website ({leadStats.website})
                </Badge>
                <Badge
                  variant={
                    quickFilterSource === "referral" ? "default" : "outline"
                  }
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs snap-start"
                  onClick={() =>
                    setQuickFilterSource((q) =>
                      q === "referral" ? null : "referral",
                    )
                  }
                >
                  👥 Referral ({leadStats.referral})
                </Badge>
              </div>
            </div>
          </div>
        </div>
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-muted/5">
          {/* Pipeline Health (matches CRM-style dashboard) */}
          <div className="px-4 md:px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PipelineCard
                title="New Leads"
                value={leadStats.new}
                change="12%"
                trend="up"
                color="bg-blue-50 text-blue-600"
                icon={Target}
              />
              <PipelineCard
                title="Engaged"
                value={leadStats.contacted}
                change="Interactions"
                trend="up"
                timeframe="Pipeline"
                color="bg-emerald-50 text-emerald-600"
                icon={Zap}
              />
              <PipelineCard
                title="Active Deals"
                value={leadStats.qualified}
                change="321+"
                trend="up"
                color="bg-indigo-50 text-indigo-600"
                icon={Calendar}
              />
              <PipelineCard
                title="Revenue Potential"
                value={`$${(leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0) / 100).toLocaleString()}`}
                change="AI Score"
                trend="up"
                color="bg-slate-50 text-slate-600"
                icon={TrendingUp}
                score="54"
              />
            </div>
          </div>

          {/* Leads Content Area */}
          <div className="flex-1 px-4 md:px-6 py-4 space-y-4">
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
                        {selectedLeads.size} lead
                        {selectedLeads.size !== 1 ? "s" : ""} selected
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
                        {bulkDeleteLeadsMutation.isPending
                          ? "Deleting..."
                          : "Delete Selected"}
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
                      title={
                        selectedLeads.size === filteredLeads.length
                          ? "Deselect all"
                          : "Select all"
                      }
                    >
                      {selectedLeads.size === filteredLeads.length &&
                      filteredLeads.length > 0 ? (
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
                ) : viewMode === "kanban" ? (
                  <LeadsKanban
                    leads={filteredLeads}
                    onLeadClick={setSelectedLead}
                    onEditLead={(lead) => {
                      setEditingLead(lead);
                      setEditTags(lead.tags || []);
                      setEditNeeds(lead.needs || []);
                      setIsEditDialogOpen(true);
                    }}
                    onDeleteLead={deleteLeadMutation.mutate}
                    onSendPaymentLink={(lead) =>
                      sendPaymentLinkMutation.mutate(lead.id)
                    }
                    onConvertLead={(lead) => {
                      setConvertingLead(lead);
                      setIsConvertDialogOpen(true);
                    }}
                  />
                ) : viewMode === "card" ? (
                  <div className="space-y-2">
                    {filteredLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isSelected={selectedLeads.has(lead.id)}
                        onToggleSelection={toggleLeadSelection}
                        onClick={(lead) => {
                          if (isMobile) {
                            setMobileLead(lead);
                            setIsMobileSheetOpen(true);
                          } else {
                            setSelectedLead(lead);
                          }
                        }}
                        onEdit={(lead) => {
                          setEditingLead(lead);
                          setEditTags(lead.tags || []);
                          setEditNeeds(lead.needs || []);
                          setIsEditDialogOpen(true);
                        }}
                        onDelete={setLeadToDelete}
                        onLogActivity={(lead, type) => {
                          setSelectedLead(lead);
                          setActivityType(type as any);
                          setIsActivityDialogOpen(true);
                        }}
                        onCall={(phone) =>
                          setLocation(
                            `/phone?number=${encodeURIComponent(phone)}&action=call`,
                          )
                        }
                        onAIAnalyze={(lead) =>
                          aiAnalyzeMutation.mutate(lead.id)
                        }
                        onAIDraftOutreach={(lead) => {
                          setSelectedLead(lead);
                          setIsAiDraftDialogOpen(true);
                          setAiDraftResult("");
                        }}
                        onSendPaymentLink={(lead) =>
                          sendPaymentLinkMutation.mutate(lead.id)
                        }
                        onConvert={(lead) => {
                          setConvertingLead(lead);
                          setIsConvertDialogOpen(true);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <LeadListView
                    leads={filteredLeads}
                    selectedLeads={selectedLeads}
                    onToggleSelection={toggleLeadSelection}
                    onSelectAll={selectAllLeads}
                    onLeadClick={(lead) => {
                      if (isMobile) {
                        setMobileLead(lead);
                        setIsMobileSheetOpen(true);
                      } else {
                        setSelectedLead(lead);
                      }
                    }}
                    onEdit={(lead) => {
                      setEditingLead(lead);
                      setEditTags(lead.tags || []);
                      setEditNeeds(lead.needs || []);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={setLeadToDelete}
                    onLogActivity={(lead, type) => {
                      setSelectedLead(lead);
                      setActivityType(type as any);
                      setIsActivityDialogOpen(true);
                    }}
                    onCall={(phone) =>
                      setLocation(
                        `/phone?number=${encodeURIComponent(phone)}&action=call`,
                      )
                    }
                    onAIAnalyze={(lead) => aiAnalyzeMutation.mutate(lead.id)}
                    onAIDraftOutreach={(lead) => {
                      setSelectedLead(lead);
                      setIsAiDraftDialogOpen(true);
                      setAiDraftResult("");
                    }}
                    onSendPaymentLink={(lead) =>
                      sendPaymentLinkMutation.mutate(lead.id)
                    }
                    onConvert={(lead) => {
                      setConvertingLead(lead);
                      setIsConvertDialogOpen(true);
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
              open={!!leadToDelete}
              onOpenChange={(open) => !open && setLeadToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <strong>{leadToDelete?.name}</strong>? This action cannot be
                    undone and will permanently remove all associated data.
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
          </div>

          {/* Import Leads Dialog */}
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Import Leads</DialogTitle>
                <DialogDescription>
                  Upload a CSV or PDF file to import multiple leads at once. AI
                  will automatically extract lead information from PDFs.
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
                    const link = document.createElement("a");
                    link.href = "/lead-import-template.csv";
                    link.download = "lead-import-template.csv";
                    link.click();
                    toast({
                      title: "✅ Template Downloaded",
                      description:
                        "Open the file, add your leads, and upload it back here!",
                    });
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>

              {!importFile && !parsedLeads.length ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById("file-input")?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("border-primary");
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove("border-primary");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-primary");
                    const file = e.dataTransfer.files[0];
                    if (
                      file &&
                      (file.type === "text/csv" ||
                        file.type === "application/pdf")
                    ) {
                      handleFileSelect(file);
                    } else {
                      toast({
                        title: "Invalid file type",
                        description: "Please upload a CSV or PDF file",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Drop your file here, or click to browse
                  </h3>
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
                  <p className="text-lg font-medium mb-2">
                    Parsing your file...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {importFile?.type === "application/pdf"
                      ? "Using AI to extract lead information from PDF"
                      : "Processing CSV data"}
                  </p>
                </div>
              ) : parsedLeads.length > 0 ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h4 className="font-semibold text-green-900 dark:text-green-100">
                        {parsedLeads.length} lead
                        {parsedLeads.length !== 1 ? "s" : ""} found!
                      </h4>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Review the leads below and click "Import All" to add them
                      to your pipeline.
                    </p>
                  </div>

                  <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-3">
                      {parsedLeads.map((lead, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Name
                                </Label>
                                <p className="font-medium">
                                  {lead.name || "N/A"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Email
                                </Label>
                                <p className="font-medium">
                                  {lead.email || "N/A"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Phone
                                </Label>
                                <p className="font-medium">
                                  {lead.phone || "N/A"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Company
                                </Label>
                                <p className="font-medium">
                                  {lead.company || "N/A"}
                                </p>
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
                          Import All {parsedLeads.length} Lead
                          {parsedLeads.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>{" "}
        {/* End Scrollable Content Area */}
      </div>

      {/* Mobile Actions Bottom Sheet */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-6">
          <SheetHeader className="text-left mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/5 text-primary font-bold">
                  {(mobileLead?.company || mobileLead?.name)
                    ?.substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">
                  {mobileLead?.company || mobileLead?.name}
                </SheetTitle>
                <SheetDescription>
                  {mobileLead?.name && mobileLead?.company
                    ? mobileLead?.name
                    : "Lead Actions"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => {
                if (mobileLead?.phone)
                  setLocation(
                    `/phone?number=${encodeURIComponent(mobileLead.phone)}&action=call`,
                  );
                setIsMobileSheetOpen(false);
              }}
              disabled={!mobileLead?.phone}
              className="flex flex-col items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-active:scale-95 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Call
              </span>
            </button>
            <button
              onClick={() => {
                if (mobileLead?.email)
                  window.location.href = `mailto:${mobileLead.email}`;
                setIsMobileSheetOpen(false);
              }}
              disabled={!mobileLead?.email}
              className="flex flex-col items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-active:scale-95 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Email
              </span>
            </button>
            <button
              onClick={() => {
                if (mobileLead?.phone)
                  setLocation(
                    `/phone?number=${encodeURIComponent(mobileLead.phone)}&action=sms`,
                  );
                setIsMobileSheetOpen(false);
              }}
              disabled={!mobileLead?.phone}
              className="flex flex-col items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 group-active:scale-95 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                SMS
              </span>
            </button>
            <button
              onClick={() => {
                setMobileLead(null);
                setIsMobileSheetOpen(false);
                setSelectedLead(mobileLead);
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-active:scale-95 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Details
              </span>
            </button>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-sm font-medium rounded-xl border-muted/50"
              onClick={() => {
                if (mobileLead) {
                  setEditingLead(mobileLead);
                  setEditTags(mobileLead.tags || []);
                  setEditNeeds(mobileLead.needs || []);
                  setIsEditDialogOpen(true);
                  setIsMobileSheetOpen(false);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-3 text-muted-foreground" />
              Edit Lead Information
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-sm font-medium rounded-xl border-muted/50"
              onClick={() => {
                if (mobileLead) {
                  setSelectedLead(mobileLead);
                  setActivityType("note");
                  setIsActivityDialogOpen(true);
                  setIsMobileSheetOpen(false);
                }
              }}
            >
              <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
              Add Activity Note
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-sm font-medium rounded-xl border-muted/50 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100"
              onClick={() => {
                if (mobileLead) {
                  aiAnalyzeMutation.mutate(mobileLead.id);
                  setIsMobileSheetOpen(false);
                }
              }}
            >
              <BrainCircuit className="w-4 h-4 mr-3" />
              AI Insights & Strategy
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-sm font-medium rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5"
              onClick={() => {
                setLeadToDelete(mobileLead);
                setIsMobileSheetOpen(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Delete Lead
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </PullToRefresh>
  );
}
