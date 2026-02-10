import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Megaphone, 
  Users, 
  Send, 
  Mail, 
  MessageSquare, 
  Target, 
  Zap, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Filter,
  Eye,
  ArrowRight,
  Plus,
  Repeat, 
  Trash2, 
  UserPlus, 
  UserMinus,
  Image,
  Video,
  X,
  Layout,
  Phone,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Clock,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/errorHandler";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import type { MarketingBroadcast, MarketingGroup, MarketingGroupMember } from "@shared/schema";

type MarketingCenterStats = {
  leads: {
    total: number;
    optedIn: number;
    industries: string[];
    tags: string[];
  };
  clients: {
    total: number;
    optedIn: number;
  };
  groups: {
    id: string;
    name: string;
    memberCount: number;
  }[];
};

type SmsInboxRow = {
  id: string | number;
  dialpad_id?: string | null;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  text: string;
  status?: string | null;
  user_id?: number | null;
  lead_id?: string | null;
  timestamp: string;
  created_at?: string | null;
  lead_company?: string | null;
  lead_name?: string | null;
};

type BroadcastRecipientRow = {
  id: number;
  broadcast_id: string;
  lead_id: string | null;
  client_id: string | null;
  custom_recipient: string | null;
  status: "pending" | "sent" | "failed";
  error_message: string | null;
  sent_at: string | null;
  lead_company?: string | null;
  lead_name?: string | null;
  lead_phone?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
};

export default function MarketingCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("composer");
  const [historyFilter, setHistoryFilter] = useState<"all" | "scheduled" | "completed">("all");
  const [broadcastType, setBroadcastType] = useState<"email" | "sms" | "whatsapp" | "telegram" | "voice">("email");
  const [audience, setAudience] = useState("all");
  const [groupId, setGroupId] = useState<string>("");
  const [customRecipient, setCustomRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [scheduledAtLocal, setScheduledAtLocal] = useState(""); // datetime-local value (local TZ)
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringEndDateLocal, setRecurringEndDateLocal] = useState("");

  // Media Upload State
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Group Management State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<MarketingGroup | null>(null);
  const [manualRecipientInput, setManualRecipientInput] = useState("");

  // Template Management State
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateType, setNewTemplateType] = useState<"email" | "sms" | "whatsapp" | "telegram" | "voice">("email");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [newTemplateMediaUrls, setNewTemplateMediaUrls] = useState<string[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<MarketingTemplate | null>(null);
  
  // AI Generation State
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [smsAnalyses, setSmsAnalyses] = useState<Record<string, any>>({});
  const [isAnalyzingSms, setIsAnalyzingSms] = useState<Record<string, boolean>>({});

  // AI Group Builder State
  const [isAiGroupDialogOpen, setIsAiGroupDialogOpen] = useState(false);
  const [aiGroupQuery, setAiGroupQuery] = useState("");
  const [isAiGroupBuilding, setIsAiGroupBuilding] = useState(false);
  const [aiGroupPreview, setAiGroupPreview] = useState<any>(null);

  const [useAiPersonalization, setUseAiPersonalization] = useState(false);

  // Marketing Series State
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);

  // Telegram Bot State
  const [isTgAutoMsgDialogOpen, setIsTgAutoMsgDialogOpen] = useState(false);
  const [tgAutoMsgName, setTgAutoMsgName] = useState("");
  const [tgAutoMsgContent, setTgAutoMsgContent] = useState("");
  const [tgAutoMsgAudience, setTgAutoMsgAudience] = useState("all_subscribers");
  const [tgAutoMsgIsRecurring, setTgAutoMsgIsRecurring] = useState(false);
  const [tgAutoMsgPattern, setTgAutoMsgPattern] = useState<"daily" | "weekly" | "monthly">("daily");
  const [tgAutoMsgInterval, setTgAutoMsgInterval] = useState(1);
  const [tgAutoMsgScheduledAt, setTgAutoMsgScheduledAt] = useState("");
  const [tgAutoMsgWelcome, setTgAutoMsgWelcome] = useState(false);
  const [tgSendingAutoMsg, setTgSendingAutoMsg] = useState<string | null>(null);

  // Telegram Bot Queries
  const { data: tgSubscribers = [], isLoading: tgSubsLoading } = useQuery<any[]>({
    queryKey: ["/api/marketing-center/telegram/subscribers"],
    enabled: activeTab === "telegram-bot",
  });

  const { data: tgSubStats } = useQuery<any>({
    queryKey: ["/api/marketing-center/telegram/subscribers/stats"],
    enabled: activeTab === "telegram-bot",
  });

  const { data: tgAutoMessages = [], isLoading: tgAutoMsgLoading } = useQuery<any[]>({
    queryKey: ["/api/marketing-center/telegram/automated-messages"],
    enabled: activeTab === "telegram-bot",
  });

  const { data: tgBotInfo } = useQuery<any>({
    queryKey: ["/api/marketing-center/telegram/bot-info"],
    enabled: activeTab === "telegram-bot",
  });

  const createTgAutoMsgMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing-center/telegram/automated-messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/telegram/automated-messages"] });
      toast({ title: "Automated message created" });
      setIsTgAutoMsgDialogOpen(false);
      setTgAutoMsgName("");
      setTgAutoMsgContent("");
      setTgAutoMsgAudience("all_subscribers");
      setTgAutoMsgIsRecurring(false);
      setTgAutoMsgWelcome(false);
      setTgAutoMsgScheduledAt("");
    },
  });

  const deleteTgAutoMsgMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing-center/telegram/automated-messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/telegram/automated-messages"] });
      toast({ title: "Automated message deleted" });
    },
  });

  const deleteTgSubscriberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing-center/telegram/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/telegram/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/telegram/subscribers/stats"] });
      toast({ title: "Subscriber removed" });
    },
  });

  // Quick Send to individual subscriber
  const [tgQuickSendChatId, setTgQuickSendChatId] = useState("");
  const [tgQuickSendMessage, setTgQuickSendMessage] = useState("");
  const [tgQuickSendingTo, setTgQuickSendingTo] = useState<string | null>(null);
  const [tgSenderName, setTgSenderName] = useState("Bobby");

  const tgQuickSendMutation = useMutation({
    mutationFn: async ({ chatId, message, senderName }: { chatId: string; message: string; senderName?: string }) => {
      const res = await apiRequest("POST", "/api/marketing-center/telegram/test", { chatId, text: message, senderName });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "Message Sent", description: "Your Telegram message was delivered." });
        setTgQuickSendMessage("");
      } else {
        toast({ title: "Send Failed", description: data.error || "Could not send message.", variant: "destructive" });
      }
      setTgQuickSendingTo(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setTgQuickSendingTo(null);
    },
  });

  // Marketing Series Queries
  const { data: seriesList = [], isLoading: seriesLoading } = useQuery<any[]>({
    queryKey: ["/api/marketing-center/series"],
  });

  const { data: currentSeries, isLoading: currentSeriesLoading } = useQuery<any>({
    queryKey: ["/api/marketing-center/series", selectedSeriesId],
    enabled: !!selectedSeriesId,
  });

  const createSeriesMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing-center/series", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/series"] });
      toast({ title: "Series Created" });
      setIsSeriesDialogOpen(false);
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/marketing-center/series/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/series"] });
      toast({ title: "Series Updated" });
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing-center/series/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/series"] });
      toast({ title: "Series Deleted" });
      setSelectedSeriesId(null);
    },
  });

  const addStepMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/marketing-center/series/${selectedSeriesId}/steps`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/series", selectedSeriesId] });
      toast({ title: "Step Added" });
      setIsStepDialogOpen(false);
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/marketing-center/series-steps/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/series", selectedSeriesId] });
      toast({ title: "Step Updated" });
      setIsStepDialogOpen(false);
      setEditingStep(null);
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing-center/series-steps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/series", selectedSeriesId] });
      toast({ title: "Step Deleted" });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async ({ seriesId, ...data }: { seriesId: string; [key: string]: any }) => {
      const res = await apiRequest("POST", `/api/marketing-center/series/${seriesId}/enroll`, data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Recipients Enrolled", description: data.message });
    },
  });

  // Marketing Stats Query
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsIsError,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<MarketingCenterStats>({
    queryKey: ["/api/marketing-center/stats"],
  });

  // Groups Query
  const { data: groups = [], isLoading: groupsLoading } = useQuery<MarketingGroup[]>({
    queryKey: ["/api/marketing-center/groups"],
  });

  // Broadcast History Query
  const { data: broadcasts, isLoading: historyLoading } = useQuery<MarketingBroadcast[]>({
    queryKey: ["/api/marketing-center/broadcasts"],
    refetchInterval: (data) => {
      // Refresh frequently if any broadcast is still sending
      if (!Array.isArray(data)) return false;
      if (data.some(b => b.status === 'sending')) return 3000;
      if (data.some(b => b.status === 'pending')) return 15000;
      return false;
    }
  });

  // Templates Query
  const { data: templates = [], isLoading: templatesLoading } = useQuery<MarketingTemplate[]>({
    queryKey: ["/api/marketing-center/templates"],
  });

  // Vapi Assistants Query
  const { data: vapiAssistants = [], isLoading: assistantsLoading } = useQuery<any[]>({
    queryKey: ["/api/marketing-center/vapi/assistants"],
    enabled: broadcastType === "voice",
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing-center/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/templates"] });
      toast({ title: "Template Created" });
      setNewTemplateName("");
      setNewTemplateSubject("");
      setNewTemplateContent("");
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/marketing-center/templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/templates"] });
      toast({ title: "Template Updated" });
      setEditingTemplate(null);
      setNewTemplateMediaUrls([]);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing-center/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/templates"] });
      toast({ title: "Template Deleted" });
    },
  });

  const handleGenerateAiContent = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please describe what you want the AI to write.",
        variant: "destructive",
      });
      return;
    }

    setIsAiGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/marketing-center/generate-content", {
        prompt: aiPrompt,
        channel: broadcastType,
        audience: audience === 'group' ? (groups.find((g: any) => g.id === groupId)?.name || "Target Group") : audience,
        context: aiContext
      });
      
      const data = await res.json();
      
      if (data.content) {
        // If it's an email, try to extract subject line
        if (broadcastType === 'email' && (data.content.toLowerCase().startsWith('subject:') || data.content.toLowerCase().includes('subject:'))) {
          const lines = data.content.split('\n');
          const subjectIndex = lines.findIndex((l: string) => l.toLowerCase().startsWith('subject:'));
          if (subjectIndex !== -1) {
            const subjectLine = lines[subjectIndex].replace(/^subject:\s*/i, '').trim();
            // Remove the subject line from the content
            lines.splice(subjectIndex, 1);
            const body = lines.join('\n').trim();
            setSubject(subjectLine);
            setContent(body);
          } else {
            setContent(data.content);
          }
        } else {
          setContent(data.content);
        }
        
        toast({
          title: "Content Generated",
          description: "AI has successfully generated your message content.",
        });
        setIsAiDialogOpen(false);
        setAiPrompt("");
        setAiContext("");
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content with AI.",
        variant: "destructive",
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const analyzeSms = async (id: string | number) => {
    setIsAnalyzingSms(prev => ({ ...prev, [id]: true }));
    try {
      const res = await apiRequest("POST", `/api/marketing-center/sms-inbox/${id}/analyze`);
      const data = await res.json();
      setSmsAnalyses(prev => ({ ...prev, [id]: data }));
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze message.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingSms(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleBuildAiGroup = async () => {
    if (!aiGroupQuery.trim()) return;
    setIsAiGroupBuilding(true);
    try {
      const res = await apiRequest("POST", "/api/marketing-center/groups/ai-builder", { query: aiGroupQuery });
      const data = await res.json();
      setAiGroupPreview(data);
    } catch (error: any) {
      toast({
        title: "Builder Failed",
        description: error.message || "Could not build group.",
        variant: "destructive",
      });
    } finally {
      setIsAiGroupBuilding(false);
    }
  };

  const saveAiGroup = useMutation({
    mutationFn: async () => {
      if (!aiGroupPreview) return;
      
      // 1. Create the group
      const groupRes = await apiRequest("POST", "/api/marketing-center/groups", {
        name: `AI: ${aiGroupQuery.slice(0, 30)}${aiGroupQuery.length > 30 ? '...' : ''}`,
        description: aiGroupPreview.explanation
      });
      const group = await groupRes.json();
      
      // 2. Add members
      const members = [
        ...aiGroupPreview.preview.leads.map((l: any) => ({ leadId: l.id })),
        ...aiGroupPreview.preview.clients.map((c: any) => ({ clientId: c.id }))
      ];
      
      for (const m of members) {
        await apiRequest("POST", `/api/marketing-center/groups/${group.id}/members`, m);
      }
      
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/stats"] });
      toast({ title: "Group Created", description: "Your AI-powered group is ready!" });
      setIsAiGroupDialogOpen(false);
      setAiGroupQuery("");
      setAiGroupPreview(null);
    }
  });

  const filteredBroadcasts = useMemo(() => {
    if (!broadcasts) return [];
    if (historyFilter === 'all') return broadcasts;
    if (historyFilter === 'scheduled') return broadcasts.filter(b => b.status === 'pending');
    if (historyFilter === 'completed') return broadcasts.filter(b => b.status === 'completed' || b.status === 'sending');
    return broadcasts;
  }, [broadcasts, historyFilter]);

  // Selected broadcast for recipient details dialog
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);

  const { data: recipients = [], isLoading: recipientsLoading } = useQuery<BroadcastRecipientRow[]>({
    queryKey: ["/api/marketing-center/broadcasts", selectedBroadcastId, "recipients"],
    enabled: !!selectedBroadcastId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/marketing-center/broadcasts/${selectedBroadcastId}/recipients`);
      return res.json();
    }
  });

  // SMS Inbox (inbound replies)
  const { data: smsInbox = [], isLoading: smsInboxLoading } = useQuery<SmsInboxRow[]>({
    queryKey: ["/api/marketing-center/sms-inbox"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/marketing-center/sms-inbox?limit=200", undefined);
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Send Broadcast Mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing-center/broadcast", data);
      return res.json();
    },
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/broadcasts"] });
      toast({
        title: created?.status === "pending" ? "📅 Broadcast Scheduled" : "🚀 Broadcast Started",
        description: created?.status === "pending"
          ? "Your campaign is saved and will send at the scheduled time."
          : "Your messages are being queued for delivery.",
      });
      setActiveTab("history");
      // Reset form
      setSubject("");
      setContent("");
      setMediaUrls([]);
      setSendMode("now");
      setScheduledAtLocal("");
    },
    onError: (error: any) => {
      toast({
        title: "Broadcast Failed",
        description: error.message || "Failed to start marketing campaign.",
        variant: "destructive"
      });
    }
  });

  const dbStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/marketing-center/db-status", undefined);
      return res.json();
    },
    onSuccess: (data: any) => {
      const leadsTotal = data?.tables?.leads?.total;
      const clientsTotal = data?.tables?.clients?.total;
      const dbName = data?.database;
      const leadsOptedInSupported = data?.tables?.leads?.optedInSupported;
      const clientsOptedInSupported = data?.tables?.clients?.optedInSupported;

      toast({
        title: "DB Status",
        description: `db=${dbName ?? "unknown"} | leads=${leadsTotal ?? "?"} | clients=${clientsTotal ?? "?"}${leadsOptedInSupported === false || clientsOptedInSupported === false ? " | opt-in columns missing" : ""}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "DB Status Failed",
        description: error.message || "Could not fetch DB status",
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing-center/groups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/stats"] });
      toast({ title: "Group Created", description: "You can now add members to this group." });
      setNewGroupName("");
      setNewGroupDescription("");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing-center/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/stats"] });
      toast({ title: "Group Deleted" });
    },
  });

  const deleteBroadcastMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/marketing-center/broadcasts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/broadcasts"] });
      toast({ title: "Broadcast Deleted", description: "The scheduled message has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, leadId, clientId, customRecipient }: { groupId: string; leadId?: string; clientId?: string; customRecipient?: string }) => {
      const res = await apiRequest("POST", `/api/marketing-center/groups/${groupId}/members`, { leadId, clientId, customRecipient });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/groups", selectedGroupForMembers?.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/stats"] });
      toast({ title: "Member Added" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ memberId }: { memberId: number; groupId: string }) => {
      await apiRequest("DELETE", `/api/marketing-center/groups/members/${memberId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/groups", variables.groupId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/stats"] });
      toast({ title: "Member Removed" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/marketing-center/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setMediaUrls((prev) => [...prev, ...data.mediaUrls]);
      toast({ title: "Media Uploaded", description: `Successfully uploaded ${data.mediaUrls.length} file(s).` });
    } catch (error: any) {
      logError(error, "Media upload");
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      // Clear the input
      e.target.value = "";
    }
  };

  const removeMedia = (url: string) => {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleTemplateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/marketing-center/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setNewTemplateMediaUrls((prev) => [...prev, ...data.mediaUrls]);
      toast({ title: "Media Uploaded", description: `Successfully uploaded ${data.mediaUrls.length} file(s).` });
    } catch (error: any) {
      logError(error, "Media upload");
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSend = () => {
    if (!content.trim()) {
      toast({ 
        title: broadcastType === 'voice' ? "Assistant ID Required" : "Content Required", 
        description: broadcastType === 'voice' ? "Please enter your Vapi Assistant ID." : "Please enter your message.", 
        variant: "destructive" 
      });
      return;
    }
    if (broadcastType === 'email' && !subject.trim()) {
      toast({ title: "Subject Required", description: "Please enter an email subject.", variant: "destructive" });
      return;
    }
    if (audience === 'individual' && !customRecipient.trim()) {
      toast({ 
        title: "Recipient Required", 
        description: `Please enter a recipient ${broadcastType === 'email' ? 'email' : broadcastType === 'telegram' ? 'chat ID (e.g. -100...)' : 'phone number'}.`, 
        variant: "destructive" 
      });
      return;
    }
    // Telegram: allow "all" (sends to all bot subscribers) or "individual" (single chat_id)
    if (broadcastType === "telegram" && audience !== "individual" && audience !== "all") {
      toast({ title: "Telegram Target Required", description: "For Telegram, choose 'All Subscribers' or 'Send to Individual' with a chat_id.", variant: "destructive" });
      return;
    }

    // If we're using audience stats, don't allow sending while stats are unavailable.
    if ((audience === "all" || audience === "leads" || audience === "clients" || audience === "group") && broadcastType !== "telegram") {
      if (statsLoading) {
        toast({ title: "Loading audience…", description: "Please wait for audience stats to load before sending.", variant: "destructive" });
        return;
      }
      if (statsIsError || !stats) {
        toast({ title: "Audience unavailable", description: "Could not load audience data from the database. Check DB status or refresh.", variant: "destructive" });
        return;
      }
      if (getRecipientCount() === 0) {
        toast({ title: "No recipients", description: "The selected audience has 0 opted-in recipients.", variant: "destructive" });
        return;
      }
    }
    if (sendMode === "scheduled") {
      if (!scheduledAtLocal) {
        toast({ title: "Schedule Required", description: "Please select a date & time to schedule.", variant: "destructive" });
        return;
      }
      const scheduled = new Date(scheduledAtLocal);
      if (Number.isNaN(scheduled.getTime())) {
        toast({ title: "Invalid Schedule", description: "Please select a valid date & time.", variant: "destructive" });
        return;
      }
      if (scheduled.getTime() <= Date.now() + 30_000) {
        toast({ title: "Schedule Too Soon", description: "Please schedule at least ~1 minute in the future.", variant: "destructive" });
        return;
      }
    }

    sendBroadcastMutation.mutate({
      type: broadcastType,
      audience,
      groupId: audience === 'group' ? groupId : null,
      customRecipient: audience === 'individual' ? customRecipient : null,
      subject: broadcastType === 'email' ? subject : null,
      content,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
      scheduledAt: sendMode === "scheduled" ? new Date(scheduledAtLocal).toISOString() : null,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : null,
      recurringInterval: isRecurring ? recurringInterval : 1,
      recurringEndDate: isRecurring && recurringEndDateLocal ? new Date(recurringEndDateLocal).toISOString() : null,
      useAiPersonalization,
    });
  };

  const getRecipientCount = () => {
    if (audience === 'individual') return customRecipient ? 1 : 0;
    if (audience === 'group') {
      const group = stats?.groups.find(g => g.id === groupId);
      return group?.memberCount || 0;
    }
    if (!stats) return 0;
    if (audience === 'all') return stats.leads.optedIn + stats.clients.optedIn;
    if (audience === 'leads') return stats.leads.optedIn;
    if (audience === 'clients') return stats.clients.optedIn;
    return 0;
  };

  const getSmsStats = () => {
    // Basic GSM-7 detection
    const isUnicode = /[^\u0000-\u007F]/.test(content);
    const segmentLimit = isUnicode ? 70 : 160;
    const segments = Math.ceil(content.length / segmentLimit) || 1;
    const isMms = mediaUrls.length > 0;
    
    // Estimate costs (Standard Twilio US rates)
    const recipients = getRecipientCount();
    let estCostPerRecipient = 0;
    if (broadcastType === 'sms') {
      estCostPerRecipient = isMms ? 0.02 : (segments * 0.0079);
    } else if (broadcastType === 'whatsapp') {
      estCostPerRecipient = 0.005; // Simplified WhatsApp rate
    }
    
    return {
      segments,
      isUnicode,
      isMms,
      totalEstCost: recipients * estCostPerRecipient
    };
  };

  const smsStats = getSmsStats();

  const totalReachDisplay = statsLoading
    ? "—"
    : statsIsError
      ? "—"
      : String(getRecipientCount() || (stats ? (stats.leads.optedIn + stats.clients.optedIn) : 0));

  const statsErrorMessage = statsIsError
    ? ((statsError as any)?.message ?? "Failed to load audience stats")
    : null;

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden p-3 md:p-8 lg:p-12 space-y-6 md:space-y-8 bg-zinc-50/50 dark:bg-zinc-950/50">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2 min-w-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gradient-purple break-words">Marketing Center</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-lg font-medium leading-tight">Broadcast mass communications to your audience</p>
        </motion.div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Card className="glass px-3 sm:px-6 py-2 sm:py-3 border-primary/20 flex items-center gap-2 sm:gap-4 shadow-xl">
            <div className="text-right">
              <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Reach</p>
              <p className="text-xl sm:text-2xl font-black text-primary tabular-nums">{totalReachDisplay}</p>
              {statsIsError && (
                <button
                  type="button"
                  className="mt-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline"
                  onClick={() => dbStatusMutation.mutate()}
                  title={statsErrorMessage ?? undefined}
                >
                  Error
                </button>
              )}
            </div>
            <div className="w-px h-6 sm:h-8 bg-zinc-200 dark:bg-zinc-800" />
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary/60" />
          </Card>

          {statsIsError && (
            <Button
              variant="outline"
              size="sm"
              className="font-bold"
              onClick={() => refetchStats()}
            >
              Retry Stats
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="w-full overflow-x-auto pb-2 -mb-2 scrollbar-hide">
          <TabsList className="glass p-1 bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-12 inline-flex items-center min-w-max">
            <TabsTrigger value="composer" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </TabsTrigger>
            <TabsTrigger value="history" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
              <History className="w-4 h-4 mr-2" /> History & Status
            </TabsTrigger>
            <TabsTrigger value="groups" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
              <Users className="w-4 h-4 mr-2" /> Groups
            </TabsTrigger>
            <TabsTrigger value="templates" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
              <Layout className="w-4 h-4 mr-2" /> Templates
            </TabsTrigger>
            <TabsTrigger value="sms-inbox" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
              <MessageSquare className="w-4 h-4 mr-2" /> SMS Inbox
            </TabsTrigger>
            <TabsTrigger value="series" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
              <RefreshCw className="w-4 h-4 mr-2" /> Automated Series
            </TabsTrigger>
            <TabsTrigger value="telegram-bot" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
              <Send className="w-4 h-4 mr-2 text-sky-500" /> Telegram Messages
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="composer" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Configuration */}
            <div className="lg:col-span-8 space-y-8">
              <Card className="glass-strong border-0 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
                <CardHeader className="border-b bg-white/50 dark:bg-zinc-900/50 p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-bold">
                      <Target className="w-6 h-6 text-primary" /> Campaign Details
                    </CardTitle>
                    <div className="w-full lg:w-auto overflow-x-auto pb-1">
                      <div className="flex flex-nowrap lg:flex-wrap gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border min-w-max lg:min-w-0">
                        <Button 
                          variant={broadcastType === 'email' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('email')}
                          className="font-bold h-8 px-3 md:px-4"
                        >
                          <Mail className="w-4 h-4 mr-2" /> Email
                        </Button>
                        <Button 
                          variant={broadcastType === 'sms' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('sms')}
                          className="font-bold h-8 px-3 md:px-4"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" /> SMS
                        </Button>
                        <Button 
                          variant={broadcastType === 'whatsapp' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('whatsapp')}
                          className="font-bold h-8 px-3 md:px-4"
                        >
                          <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" /> WhatsApp
                        </Button>
                        <Button 
                          variant={broadcastType === 'telegram' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('telegram')}
                          className="font-bold h-8 px-3 md:px-4"
                        >
                          <MessageSquare className="w-4 h-4 mr-2 text-sky-500" /> Telegram
                        </Button>
                        <Button 
                          variant={broadcastType === 'voice' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('voice')}
                          className="font-bold h-8 px-3 md:px-4"
                        >
                          <Phone className="w-4 h-4 mr-2 text-rose-500" /> AI Voice
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-8 space-y-6 relative">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Audience</Label>
                      <Select value={audience} onValueChange={setAudience}>
                        <SelectTrigger className="h-12 glass border-2">
                          <SelectValue placeholder="Target Audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{broadcastType === 'telegram' ? 'All Telegram Subscribers' : 'All Customers (Leads + Clients)'}</SelectItem>
                          {broadcastType !== 'telegram' && <SelectItem value="leads">Leads Only</SelectItem>}
                          {broadcastType !== 'telegram' && <SelectItem value="clients">Clients Only</SelectItem>}
                          {broadcastType !== 'telegram' && <SelectItem value="group">Custom Group</SelectItem>}
                          <SelectItem value="individual">{broadcastType === 'telegram' ? 'Individual Chat ID' : 'Send to Individual'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {audience === 'individual' ? (
                      <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          {broadcastType === 'email'
                            ? 'Recipient Email'
                            : broadcastType === 'telegram'
                              ? 'Recipient Telegram chat_id'
                              : broadcastType === 'voice'
                                ? 'Recipient Phone (Voice)'
                                : 'Recipient Phone Number'}
                        </Label>
                        <Input 
                          placeholder={
                            broadcastType === 'email'
                              ? "hello@example.com"
                              : broadcastType === 'telegram'
                                ? "-1001234567890"
                                : "+1234567890"
                          }
                          value={customRecipient}
                          onChange={(e) => setCustomRecipient(e.target.value)}
                          className="h-12 glass border-2 font-semibold"
                        />
                        {broadcastType === 'telegram' && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-tight">
                              <span className="text-sky-500 font-bold">Tip:</span> To find your ID, add your bot to a group and use <code>@userinfobot</code>. Group/Channel IDs <strong>must</strong> start with <code>-100</code>.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-[10px] font-bold uppercase tracking-widest"
                              onClick={async () => {
                                if (!customRecipient.trim()) {
                                  toast({
                                    title: "Missing ID",
                                    description: "Please enter a Telegram chat_id first.",
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                try {
                                  const res = await apiRequest("POST", "/api/marketing-center/telegram/test", {
                                    chatId: customRecipient,
                                    text: "Verification from MarketingOS: Your bot connection is active!"
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    toast({
                                      title: "Success",
                                      description: "Test message sent! Check your Telegram group/channel.",
                                    });
                                  } else {
                                    toast({
                                      title: "Connection Failed",
                                      description: data.error || "Could not reach Telegram.",
                                      variant: "destructive"
                                    });
                                  }
                                } catch (err: any) {
                                  toast({
                                    title: "Error",
                                    description: err.message,
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <Zap className="w-3 h-3 mr-1 text-sky-500" /> Test Connection
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : audience === 'group' ? (
                      <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Group</Label>
                        <Select value={groupId} onValueChange={setGroupId}>
                          <SelectTrigger className="h-12 glass border-2">
                            <SelectValue placeholder="Select a marketing group" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                            {groups.length === 0 && (
                              <SelectItem value="none" disabled>No groups created yet</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sender Account</Label>
                      <Input 
                        disabled 
                          value={
                            broadcastType === 'email'
                              ? "business@marketingteam.app"
                              : broadcastType === 'whatsapp'
                                ? "Twilio WhatsApp"
                                : broadcastType === 'telegram'
                                  ? "Telegram Bot"
                                  : "Twilio Official"
                          } 
                        className="h-12 glass border-2 font-semibold text-primary"
                      />
                    </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Send Mode</Label>
                      <Select value={sendMode} onValueChange={(v) => setSendMode(v as any)}>
                        <SelectTrigger className="h-12 glass border-2">
                          <SelectValue placeholder="Send mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="now">Send Now</SelectItem>
                          <SelectItem value="scheduled">Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={`space-y-2 ${sendMode === "scheduled" ? "animate-in slide-in-from-left-2 duration-300" : ""}`}>
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Scheduled For</Label>
                      <Input
                        type="datetime-local"
                        disabled={sendMode !== "scheduled"}
                        value={scheduledAtLocal}
                        onChange={(e) => setScheduledAtLocal(e.target.value)}
                        className="h-12 glass border-2 font-semibold"
                      />
                      {sendMode === "scheduled" && scheduledAtLocal && !Number.isNaN(new Date(scheduledAtLocal).getTime()) && (
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                          Will send: {format(new Date(scheduledAtLocal), "PPpp")}
                        </p>
                      )}
                    </div>
                  </div>

                  {sendMode === "scheduled" && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-6 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-primary" />
                        <Label className="text-base font-bold">Recurring Options</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="recurring" 
                          checked={isRecurring} 
                          onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                        />
                        <label
                          htmlFor="recurring"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Make this a recurring campaign
                        </label>
                      </div>

                      {isRecurring && (
                        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pattern</Label>
                            <Select value={recurringPattern} onValueChange={(v: any) => setRecurringPattern(v)}>
                              <SelectTrigger className="h-10 glass border-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Every (Interval)</Label>
                            <Input 
                              type="number" 
                              min={1} 
                              value={recurringInterval} 
                              onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                              className="h-10 glass border-2 font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Date (Optional)</Label>
                            <Input 
                              type="date" 
                              value={recurringEndDateLocal} 
                              onChange={(e) => setRecurringEndDateLocal(e.target.value)}
                              className="h-10 glass border-2 font-semibold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Templates</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10 bg-primary/5 group"
                        onClick={() => setIsAiDialogOpen(true)}
                      >
                        <Sparkles className="w-3 h-3 mr-1.5 text-primary group-hover:animate-pulse" />
                        Generate with AI
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {templates.filter(t => t.type === broadcastType).map(t => (
                        <Button
                          key={t.id}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-widest bg-primary/5 hover:bg-primary/10 border-primary/20"
                          onClick={() => {
                            if (t.type === 'email' && t.subject) {
                              setSubject(t.subject);
                            }
                            setContent(t.content);
                            toast({ title: "Template Applied", description: t.name });
                          }}
                        >
                          {t.name}
                        </Button>
                      ))}
                      {templates.filter(t => t.type === broadcastType).length === 0 && (
                        <p className="text-[10px] text-muted-foreground font-medium italic">No {broadcastType} templates found. Create one in the Templates tab.</p>
                      )}
                    </div>
                  </div>

                  {broadcastType === 'email' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email Subject</Label>
                      <Input 
                        placeholder="Exciting updates from Marketing Team..." 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-12 glass border-2 focus-visible:ring-primary/20"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {broadcastType === 'voice' ? 'Vapi Assistant ID' : 'Message Content'}
                    </Label>
                    {broadcastType === 'voice' ? (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Select Assistant</Label>
                            <Select value={content} onValueChange={setContent}>
                              <SelectTrigger className="h-12 glass border-2">
                                <SelectValue placeholder={assistantsLoading ? "Loading assistants..." : "Choose a Vapi Assistant"} />
                              </SelectTrigger>
                              <SelectContent>
                                {vapiAssistants.map((assistant) => (
                                  <SelectItem key={assistant.id} value={assistant.id}>
                                    {assistant.name || assistant.id}
                                  </SelectItem>
                                ))}
                                {vapiAssistants.length === 0 && !assistantsLoading && (
                                  <SelectItem value="none" disabled>No assistants found</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Or Enter ID Manually</Label>
                            <Input 
                              placeholder="Assistant UUID"
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              className="h-12 glass border-2 font-mono"
                            />
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-black uppercase">Vapi AI Voice Integration</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Launch automated AI voice calls to your selected audience. The assistant defined by this ID will engage in a human-like conversation with each recipient. 
                            <br /><br />
                            <span className="font-bold">Personalization:</span> The recipient's name and company will be passed to Vapi for a personalized experience.
                          </p>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-xs text-rose-500 font-bold"
                            onClick={() => window.open('https://dashboard.vapi.ai', '_blank')}
                          >
                            Open Vapi Dashboard <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Textarea 
                          placeholder={
                            broadcastType === 'email'
                              ? "Write your premium marketing email here (HTML supported)..."
                              : broadcastType === 'whatsapp'
                                ? "Write your WhatsApp message here..."
                                : broadcastType === 'telegram'
                                  ? "Write your Telegram message here..."
                                  : "Write your concise SMS message here..."
                          }
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="min-h-[300px] glass border-2 resize-none text-lg leading-relaxed focus-visible:ring-primary/20"
                        />
                        {(broadcastType === 'sms' || broadcastType === 'whatsapp') && (
                          <div className="flex justify-between items-center px-1">
                            <div className="flex gap-2">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                {smsStats.isMms ? 'MMS Mode (Higher Limit)' : `Segments: ${smsStats.segments}`}
                              </p>
                              {smsStats.isUnicode && (
                                <Badge variant="outline" className="h-4 text-[8px] font-black uppercase text-amber-500 border-amber-500/20">
                                  Unicode/Emoji Detected
                                </Badge>
                              )}
                            </div>
                            <p className={`text-xs font-bold ${content.length > (smsStats.isUnicode ? 70 : 160) ? 'text-amber-500' : 'text-muted-foreground'}`}>
                              {content.length} / {smsStats.isMms ? '1600' : (smsStats.isUnicode ? '70' : '160')}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {broadcastType !== 'voice' && broadcastType !== 'telegram' && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10 space-y-3 animate-in fade-in duration-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <Label htmlFor="ai-personalization" className="text-sm font-bold cursor-pointer">Hyper-Personalization</Label>
                        </div>
                        <Checkbox 
                          id="ai-personalization" 
                          checked={useAiPersonalization} 
                          onCheckedChange={(checked) => setUseAiPersonalization(checked as boolean)}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        When enabled, AI will generate a <span className="text-primary font-bold">unique, personalized opening hook</span> for every lead based on their company name and your private notes, making your messages feel human and 1-on-1.
                      </p>
                    </div>
                  )}

                  {/* Media Upload Section */}
                  {(broadcastType === 'sms' || broadcastType === 'whatsapp') && (
                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Attach Media (MMS)</Label>
                        <span className="text-[10px] font-medium text-muted-foreground">Max 10 files. Images/Videos supported.</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {mediaUrls.map((url, i) => (
                          <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-primary/20 bg-zinc-100 dark:bg-zinc-800">
                            {url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                              <video src={url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={url} alt="Uploaded media" className="w-full h-full object-cover" />
                            )}
                            <button
                              onClick={() => removeMedia(url)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        {mediaUrls.length < 10 && (
                          <label className="relative aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                            {isUploading ? (
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                  <Plus className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Media</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Preview & Trigger */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="glass border-primary/20 overflow-hidden shadow-2xl sticky top-24">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-xl font-black">Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-muted-foreground font-medium">Channel</span>
                      <Badge className={`font-black uppercase ${broadcastType === 'voice' ? 'bg-rose-500 hover:bg-rose-600' : ''}`}>{broadcastType}</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-muted-foreground font-medium">Recipients</span>
                      <div className="text-right">
                        <span className="text-lg font-black">
                          {audience === 'group' ? (groups.find(g => g.id === groupId)?.name || "Select Group") : getRecipientCount()}
                        </span>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {audience === 'group' ? "Target Group" : "People Reachable"}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-muted-foreground font-medium">Schedule</span>
                      <div className="text-right">
                        <span className="font-black block">
                          {sendMode === "scheduled" && scheduledAtLocal
                            ? format(new Date(scheduledAtLocal), "PPpp")
                            : "Now (Instant)"}
                        </span>
                        {isRecurring && (
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            Recurring {recurringPattern}
                          </span>
                        )}
                      </div>
                    </div>
                    {broadcastType !== 'email' && (
                      <div className="flex justify-between items-center py-2 border-b border-dashed bg-primary/5 -mx-6 px-6">
                        <span className="text-muted-foreground font-medium">
                          {broadcastType === 'voice' ? 'Est. Vapi Cost' : 'Est. Twilio Cost'}
                        </span>
                        <div className="text-right">
                          <span className="text-lg font-black text-primary">
                            ${broadcastType === 'voice' ? (getRecipientCount() * 0.15).toFixed(2) : smsStats.totalEstCost.toFixed(3)}
                          </span>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            {broadcastType === 'voice' ? '~$0.15 / min' : (smsStats.isMms ? 'MMS Rate' : `SMS Rate (${smsStats.segments} segments)`)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-black uppercase">Final Check</span>
                    </div>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed font-medium">
                      You are about to send a mass {broadcastType} to {getRecipientCount()} people. This action cannot be reversed once started.
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-16 text-lg font-black shadow-xl shadow-primary/30 group relative overflow-hidden"
                    onClick={handleSend}
                    disabled={sendBroadcastMutation.isPending || getRecipientCount() === 0}
                  >
                    <AnimatePresence mode="wait">
                      {sendBroadcastMutation.isPending ? (
                        <motion.div 
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-5 h-5 animate-spin" /> QUEUEING...
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="ready"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          LAUNCH CAMPAIGN <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in duration-500">
          <div className="space-y-6">
            <div className="flex items-center justify-between overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                <Button 
                  variant={historyFilter === 'all' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setHistoryFilter('all')}
                  className="font-bold h-8"
                >
                  All
                </Button>
                <Button 
                  variant={historyFilter === 'scheduled' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setHistoryFilter('scheduled')}
                  className="font-bold h-8"
                >
                  Scheduled
                </Button>
                <Button 
                  variant={historyFilter === 'completed' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setHistoryFilter('completed')}
                  className="font-bold h-8"
                >
                  Sent
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {!filteredBroadcasts || filteredBroadcasts.length === 0 ? (
              <Card className="glass-strong border-dashed border-2 p-20 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                  <History className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">No campaigns yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Once you launch your first broadcast, it will appear here with real-time delivery tracking.</p>
                </div>
                <Button variant="outline" onClick={() => setActiveTab("composer")} className="font-bold border-2">
                  Create First Campaign <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            ) : (
              filteredBroadcasts.map((broadcast) => (
                <motion.div
                  key={broadcast.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass hover:shadow-xl transition-all duration-300 border-primary/10 overflow-hidden group">
                    <div className="flex flex-col lg:flex-row lg:items-stretch">
                      {/* Left: Type Icon */}
                      <div className={`w-full lg:w-32 py-6 lg:py-0 flex items-center justify-center ${broadcast.type === 'email' ? 'bg-blue-500/10' : broadcast.type === 'whatsapp' ? 'bg-emerald-500/10' : broadcast.type === 'voice' ? 'bg-rose-500/10' : 'bg-green-500/10'}`}>
                        {broadcast.type === 'email' ? (
                          <Mail className="w-8 h-8 text-blue-500" />
                        ) : broadcast.type === 'whatsapp' ? (
                          <MessageSquare className="w-8 h-8 text-emerald-500" />
                        ) : broadcast.type === 'telegram' ? (
                          <MessageSquare className="w-8 h-8 text-sky-500" />
                        ) : broadcast.type === 'voice' ? (
                          <Phone className="w-8 h-8 text-rose-500" />
                        ) : (
                          <MessageSquare className="w-8 h-8 text-green-500" />
                        )}
                      </div>

                      {/* Center: Content */}
                      <div className="flex-1 p-4 md:p-6 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg md:text-xl font-bold truncate max-w-full">
                            {broadcast.type === 'email' 
                              ? broadcast.subject 
                              : broadcast.type === 'voice'
                                ? `Voice: ${broadcast.content.substring(0, 15)}...`
                                : broadcast.content.substring(0, 50) + '...'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-widest bg-zinc-100 dark:bg-zinc-800">
                              {broadcast.audience === 'individual' ? `Individual: ${broadcast.customRecipient}` : broadcast.audience}
                            </Badge>
                            {broadcast.status === 'pending' ? (
                              <Badge className="bg-amber-500 text-white font-black uppercase text-[10px]">Scheduled</Badge>
                            ) : broadcast.status === 'sending' ? (
                              <Badge className="bg-primary animate-pulse font-black uppercase text-[10px]">Sending...</Badge>
                            ) : broadcast.status === 'completed' ? (
                              <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px]">Completed</Badge>
                            ) : (
                              <Badge variant="destructive" className="font-black uppercase text-[10px]">{broadcast.status}</Badge>
                            )}
                            {broadcast.mediaUrls && broadcast.mediaUrls.length > 0 && (
                              <Badge variant="outline" className="font-bold text-[10px] bg-primary/5 text-primary border-primary/20">
                                <Image className="w-3 h-3 mr-1" /> {broadcast.mediaUrls.length} Media
                              </Badge>
                            )}
                          </div>

                          {/* Always-visible diagnostics button (mobile-friendly) */}
                          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-initial"
                              onClick={() => setSelectedBroadcastId(broadcast.id)}
                              disabled={broadcast.status === 'pending'}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Recipients
                            </Button>
                            {(broadcast.status === 'pending' || broadcast.status === 'failed') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete this ${broadcast.status === 'pending' ? 'scheduled' : 'failed'} broadcast?`)) {
                                    deleteBroadcastMutation.mutate(broadcast.id);
                                  }
                                }}
                                disabled={deleteBroadcastMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          <Zap className="w-3 h-3" />{" "}
                          {broadcast.status === "pending" && (broadcast as any).scheduledAt
                            ? `Scheduled for ${format(new Date((broadcast as any).scheduledAt), "PPpp")}`
                            : `Sent ${formatDistanceToNow(new Date((broadcast as any).createdAt!), { addSuffix: true })}`}
                        </p>
                      </div>

                      {/* Right: Progress */}
                      <div className="p-4 md:p-6 lg:w-80 border-t lg:border-t-0 lg:border-l bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-xl md:text-2xl font-black">{broadcast.successCount}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Successful</p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-base md:text-lg font-bold text-zinc-400">/ {broadcast.totalRecipients}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                            </div>
                          </div>
                          <Progress 
                            value={broadcast.totalRecipients ? (broadcast.successCount! / broadcast.totalRecipients) * 100 : 0} 
                            className="h-2 bg-zinc-200 dark:bg-zinc-800"
                          />
                          {broadcast.failedCount! > 0 && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-widest">
                                <AlertCircle className="w-3 h-3" /> {broadcast.failedCount} Failed Deliveries
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
                                onClick={() => setSelectedBroadcastId(broadcast.id)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </TabsContent>

        <TabsContent value="groups" className="animate-in fade-in duration-500">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <Card className="glass-strong border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl font-bold">Create New Group</CardTitle>
                    <CardDescription>Group recipients for targeted campaigns</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                    onClick={() => setIsAiGroupDialogOpen(true)}
                  >
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-widest text-primary">AI Powered Discovery</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Instead of manual filtering, let AI find your audience. Just describe who you want to reach.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10 bg-white/50 dark:bg-zinc-900/50"
                      onClick={() => setIsAiGroupDialogOpen(true)}
                    >
                      Open AI Group Builder
                    </Button>
                  </div>
                  
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-dashed" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold">
                      <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground">Or Create Manually</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Group Name</Label>
                    <Input 
                      placeholder="e.g., Q1 Hot Leads" 
                      value={newGroupName} 
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="glass border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (Optional)</Label>
                    <Textarea 
                      placeholder="What is this group for?" 
                      value={newGroupDescription} 
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      className="glass border-2 resize-none h-24"
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t p-6">
                  <Button 
                    className="w-full font-black" 
                    onClick={() => createGroupMutation.mutate({ name: newGroupName, description: newGroupDescription })}
                    disabled={!newGroupName.trim() || createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    CREATE GROUP
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-6">
                {groups.length === 0 ? (
                  <Card className="glass-strong border-dashed border-2 p-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white">No groups yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">Create your first group to start targeted marketing campaigns.</p>
                    </div>
                  </Card>
                ) : (
                  groups.map((group) => (
                    <Card key={group.id} className="glass hover:shadow-xl transition-all duration-300 border-primary/10 overflow-hidden group">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold">{group.name}</h3>
                            <p className="text-sm text-muted-foreground">{group.description || "No description provided"}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="font-bold text-[10px] tracking-widest uppercase">
                                {format(new Date(group.createdAt!), "MMM d, yyyy")}
                              </Badge>
                              <Badge variant="outline" className="font-bold text-[10px] tracking-widest uppercase bg-primary/5 text-primary border-primary/20">
                                {stats?.groups.find(g => g.id === group.id)?.memberCount || 0} Members
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog onOpenChange={(open) => {
                              if (open) setSelectedGroupForMembers(group);
                              else setSelectedGroupForMembers(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="font-bold">
                                  <Users className="w-4 h-4 mr-2" /> Manage Members
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Manage Members: {group.name}</DialogTitle>
                                  <DialogDescription>Add or remove leads and clients from this group.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-bold uppercase">Add Lead</Label>
                                      <Select onValueChange={(val) => addMemberMutation.mutate({ groupId: group.id, leadId: val })}>
                                        <SelectTrigger className="glass border-2">
                                          <SelectValue placeholder="Search leads..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <LeadOptions />
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-bold uppercase">Add Client</Label>
                                      <Select onValueChange={(val) => addMemberMutation.mutate({ groupId: group.id, clientId: val })}>
                                        <SelectTrigger className="glass border-2">
                                          <SelectValue placeholder="Search clients..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <ClientOptions />
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="space-y-2 pt-2 border-t border-dashed">
                                    <Label className="text-xs font-bold uppercase">Add Manual Recipient (Phone/Email)</Label>
                                    <div className="flex gap-2">
                                      <Input 
                                        placeholder="+1234567890 or email@example.com"
                                        value={manualRecipientInput}
                                        onChange={(e) => setManualRecipientInput(e.target.value)}
                                        className="glass border-2"
                                      />
                                      <Button 
                                        size="sm"
                                        onClick={() => {
                                          if (!manualRecipientInput.trim()) return;
                                          addMemberMutation.mutate({ 
                                            groupId: group.id, 
                                            customRecipient: manualRecipientInput.trim() 
                                          });
                                          setManualRecipientInput("");
                                        }}
                                        disabled={addMemberMutation.isPending || !manualRecipientInput.trim()}
                                      >
                                        {addMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Members</Label>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                      <MemberList
                                        groupId={group.id}
                                        onRemove={(memberId) => removeMemberMutation.mutate({ memberId, groupId: group.id })}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this group?")) {
                                  deleteGroupMutation.mutate(group.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="animate-in fade-in duration-500">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <Card className="glass-strong border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-xl font-bold">
                    {editingTemplate ? "Edit Template" : "Create New Template"}
                  </CardTitle>
                  <CardDescription>Save reusable message content</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Template Name</Label>
                    <Input 
                      placeholder="e.g., Welcome Email" 
                      value={newTemplateName} 
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="glass border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
                    <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                      <SelectTrigger className="glass border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newTemplateType === 'email' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Subject</Label>
                      <Input 
                        placeholder="Subject line" 
                        value={newTemplateSubject} 
                        onChange={(e) => setNewTemplateSubject(e.target.value)}
                        className="glass border-2"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content</Label>
                    <Textarea 
                      placeholder="Template content..." 
                      value={newTemplateContent} 
                      onChange={(e) => setNewTemplateContent(e.target.value)}
                      className="glass border-2 min-h-[200px]"
                    />
                  </div>
                  {/* Template Media Upload */}
                  {(newTemplateType === 'sms' || newTemplateType === 'whatsapp') && (
                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Template Media</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {newTemplateMediaUrls.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-zinc-100 dark:bg-zinc-800">
                            {url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                              <video src={url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={url} alt="Template media" className="w-full h-full object-cover" />
                            )}
                            <button
                              onClick={() => setNewTemplateMediaUrls(prev => prev.filter(u => u !== url))}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ))}
                        {newTemplateMediaUrls.length < 10 && (
                          <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary transition-all cursor-pointer flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50">
                            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleTemplateFileUpload} disabled={isUploading} />
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t p-6 flex gap-2">
                  {editingTemplate && (
                    <Button 
                      variant="outline"
                      className="flex-1 font-black"
                      onClick={() => {
                        setEditingTemplate(null);
                        setNewTemplateName("");
                        setNewTemplateSubject("");
                        setNewTemplateContent("");
                        setNewTemplateMediaUrls([]);
                      }}
                    >
                      CANCEL
                    </Button>
                  )}
                  <Button 
                    className="flex-[2] font-black" 
                    onClick={() => {
                      if (editingTemplate) {
                        updateTemplateMutation.mutate({
                          id: editingTemplate.id,
                          name: newTemplateName,
                          type: newTemplateType,
                          subject: newTemplateSubject,
                          content: newTemplateContent,
                          mediaUrls: newTemplateMediaUrls.length > 0 ? newTemplateMediaUrls : null,
                        });
                      } else {
                        createTemplateMutation.mutate({
                          name: newTemplateName,
                          type: newTemplateType,
                          subject: newTemplateSubject,
                          content: newTemplateContent,
                          mediaUrls: newTemplateMediaUrls.length > 0 ? newTemplateMediaUrls : null,
                        });
                      }
                    }}
                    disabled={!newTemplateName.trim() || !newTemplateContent.trim() || createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  >
                    {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {editingTemplate ? "UPDATE TEMPLATE" : "CREATE TEMPLATE"}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-6">
                {templatesLoading ? (
                  <Card className="glass p-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading templates...
                    </div>
                  </Card>
                ) : templates.length === 0 ? (
                  <Card className="glass-strong border-dashed border-2 p-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                      <Target className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white">No templates yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">Create reusable templates for your marketing campaigns.</p>
                    </div>
                  </Card>
                ) : (
                  templates.map((template) => (
                    <Card key={template.id} className="glass hover:shadow-xl transition-all duration-300 border-primary/10 overflow-hidden group">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-bold">{template.name}</h3>
                              <Badge variant="outline" className="font-bold text-[10px] tracking-widest uppercase bg-primary/5 text-primary border-primary/20">
                                {template.type}
                              </Badge>
                            </div>
                            {template.subject && (
                              <p className="text-sm font-semibold text-muted-foreground line-clamp-1">
                                <span className="text-[10px] uppercase tracking-wider opacity-70">Subject:</span> {template.subject}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2 italic bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border">
                              {template.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="font-bold"
                              onClick={() => {
                                setEditingTemplate(template);
                                setNewTemplateName(template.name);
                                setNewTemplateType(template.type as any);
                                setNewTemplateSubject(template.subject || "");
                                setNewTemplateContent(template.content);
                                setNewTemplateMediaUrls(template.mediaUrls || []);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this template?")) {
                                  deleteTemplateMutation.mutate(template.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sms-inbox" className="animate-in fade-in duration-500">
          <div className="grid gap-4">
            {smsInboxLoading ? (
              <Card className="glass p-10 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading SMS inbox...
                </div>
              </Card>
            ) : smsInbox.length === 0 ? (
              <Card className="glass-strong border-dashed border-2 p-20 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">No replies yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Incoming SMS replies to your Twilio number will appear here once your Twilio webhook is configured.
                  </p>
                </div>
              </Card>
            ) : (
              smsInbox.map((m) => (
                <Card key={`${m.id}`} className="glass border-primary/10 overflow-hidden">
                  <CardContent className="p-4 md:p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="font-black uppercase text-[10px] tracking-widest">
                          Inbound
                        </Badge>
                        <span className="font-black truncate max-w-[420px]">
                          {m.lead_company || m.lead_name || m.from_number}
                        </span>
                        <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-widest bg-zinc-100 dark:bg-zinc-800">
                          From: {m.from_number}
                        </Badge>
                        <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-widest bg-zinc-100 dark:bg-zinc-800">
                          To: {m.to_number}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Zap className="w-3 h-3" /> {formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })}
                      </p>
                      
                      {smsAnalyses[m.id] && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              className={`font-black uppercase text-[10px] tracking-widest ${
                                smsAnalyses[m.id].sentiment === 'positive' ? 'bg-emerald-500' : 
                                smsAnalyses[m.id].sentiment === 'negative' ? 'bg-rose-500' : 'bg-zinc-500'
                              }`}
                            >
                              {smsAnalyses[m.id].sentiment}
                            </Badge>
                            <Badge variant="outline" className="font-black uppercase text-[10px] tracking-widest border-primary/30 text-primary">
                              {smsAnalyses[m.id].intent.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            AI Summary: <span className="font-medium text-muted-foreground">{smsAnalyses[m.id].summary}</span>
                          </p>
                          <div className="pt-2 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Suggested Reply:</span>
                            <p className="text-xs p-2 bg-white dark:bg-zinc-900 rounded border border-primary/20 italic">
                              "{smsAnalyses[m.id].suggestedReply}"
                            </p>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-[10px] font-bold uppercase tracking-widest text-primary self-start"
                              onClick={() => {
                                setContent(smsAnalyses[m.id].suggestedReply);
                                setAudience("individual");
                                setCustomRecipient(m.from_number);
                                setActiveTab("composer");
                                toast({ title: "Reply copied to composer" });
                              }}
                            >
                              Copy to Composer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!smsAnalyses[m.id] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-bold text-primary group"
                            onClick={() => analyzeSms(m.id)}
                            disabled={isAnalyzingSms[m.id]}
                          >
                            {isAnalyzingSms[m.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                            )}
                            Analyze
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="font-bold"
                          onClick={() => {
                            setBroadcastType(m.dialpad_id ? "sms" : "whatsapp"); 
                            setAudience("individual");
                            setCustomRecipient(m.from_number);
                            setActiveTab("composer");
                          }}
                        >
                          Reply
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="series" className="animate-in fade-in duration-500">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Series List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight">Your Series</h3>
                <Button size="sm" onClick={() => setIsSeriesDialogOpen(true)} className="font-bold">
                  <Plus className="w-4 h-4 mr-2" /> Create
                </Button>
              </div>
              
              {seriesLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : seriesList.length === 0 ? (
                <Card className="glass border-dashed p-10 text-center text-muted-foreground">
                  No automated series created yet.
                </Card>
              ) : (
                <div className="space-y-2">
                  {seriesList.map((s) => (
                    <Card 
                      key={s.id} 
                      className={`glass cursor-pointer transition-all hover:border-primary/50 ${selectedSeriesId === s.id ? 'border-primary ring-1 ring-primary' : 'border-zinc-200'}`}
                      onClick={() => setSelectedSeriesId(s.id)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold truncate">{s.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-black uppercase">{s.type}</Badge>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                              {s.isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Series Editor/Detail */}
            <div className="lg:col-span-8">
              {!selectedSeriesId ? (
                <Card className="glass-strong border-dashed border-2 h-[400px] flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <RefreshCw className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="font-bold text-muted-foreground">Select a series to manage steps</p>
                  </div>
                </Card>
              ) : currentSeriesLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : (
                <div className="space-y-6">
                  <Card className="glass-strong overflow-hidden border-0 shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-black">{currentSeries.name}</CardTitle>
                          <CardDescription>{currentSeries.description || 'No description provided'}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-bold"
                            onClick={() => updateSeriesMutation.mutate({ id: currentSeries.id, isActive: !currentSeries.isActive })}
                          >
                            {currentSeries.isActive ? 'Pause' : 'Activate'}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-9 w-9"
                            onClick={() => {
                              if (confirm("Are you sure? This will delete the series and all steps.")) {
                                deleteSeriesMutation.mutate(currentSeries.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary">Sequence Steps</h4>
                        <Button size="sm" variant="outline" onClick={() => { setEditingStep(null); setIsStepDialogOpen(true); }} className="font-bold">
                          <Plus className="w-4 h-4 mr-2" /> Add Step
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {currentSeries.steps.length === 0 ? (
                          <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground font-medium">
                            No steps added yet. Add your first message!
                          </div>
                        ) : (
                          currentSeries.steps.map((step: any, idx: number) => (
                            <div key={step.id} className="relative pl-8">
                              {idx < currentSeries.steps.length - 1 && (
                                <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />
                              )}
                              <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black">
                                {idx + 1}
                              </div>
                              <Card className="glass group hover:border-primary/30 transition-all">
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 font-bold">
                                        <Clock className="w-3 h-3 mr-1" /> 
                                        Delay: {step.delayDays || 0}d {step.delayHours || 0}h
                                      </Badge>
                                      {step.subject && (
                                        <span className="text-sm font-bold truncate max-w-[200px]">{step.subject}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingStep(step); setIsStepDialogOpen(true); }}>
                                        <Settings className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => deleteStepMutation.mutate(step.id)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm line-clamp-2 text-muted-foreground whitespace-pre-wrap">{step.content}</p>
                                </CardContent>
                              </Card>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-t">
                      <div className="w-full flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Automation Status</p>
                          <p className="text-xs font-medium">Ready to enroll leads or groups into this sequence.</p>
                        </div>
                        <Button 
                          className="font-black bg-primary hover:bg-primary/90"
                          onClick={() => {
                            // Quick enroll from selected audience
                            if (audience === 'individual' && customRecipient) {
                              enrollMutation.mutate({
                                seriesId: currentSeries.id,
                                leadIds: [],
                                clientIds: [],
                                customRecipient
                              });
                            } else if (audience === 'group' && groupId) {
                              enrollMutation.mutate({
                                seriesId: currentSeries.id,
                                groupIds: [groupId]
                              });
                            } else {
                              toast({ title: "Select Audience", description: "Choose a group or individual in the Campaign Details above first." });
                            }
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" /> Enroll Current Audience
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===================== TELEGRAM BOT TAB ===================== */}
        <TabsContent value="telegram-bot" className="animate-in fade-in duration-500">
          <div className="space-y-6">
            {/* Bot Info & Setup */}
            <Card className="glass border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-sky-500" />
                  Telegram Bot Setup
                </CardTitle>
                <CardDescription>
                  Send Telegram messages as @bobbywealthy through your bot.
                  <strong>Step 1:</strong> Open @Bobbymemubot in Telegram and send /start (do this for each person you want to message).
                  <strong>Step 2:</strong> Use Quick Send below to message anyone, or set up automated scheduled messages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Bot Username</p>
                    <p className="text-lg font-black text-primary">
                      {tgBotInfo?.bot ? `@${tgBotInfo.bot.username}` : "Not configured"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Webhook Status</p>
                    <p className="text-lg font-black">
                      {tgBotInfo?.webhook?.url ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-orange-500">Not Set</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Active Subscribers</p>
                    <p className="text-lg font-black text-primary">
                      {tgSubStats?.active ?? 0}
                    </p>
                  </div>
                </div>

                {!tgBotInfo?.webhook?.url && tgBotInfo?.bot && (
                  <Button
                    variant="default"
                    size="sm"
                    className="font-bold"
                    onClick={async () => {
                      try {
                        const res = await apiRequest("POST", "/api/marketing-center/telegram/setup-webhook", {});
                        const data = await res.json();
                        if (data.success) {
                          toast({ title: "Webhook Set", description: "Telegram webhook configured successfully." });
                          queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/telegram/bot-info"] });
                        } else {
                          toast({ title: "Failed", description: data.error || "Could not set webhook.", variant: "destructive" });
                        }
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" /> Setup Webhook
                  </Button>
                )}

                {tgBotInfo?.bot && (
                  <p className="text-xs text-muted-foreground">
                    Share this link for people to subscribe: <code className="bg-muted px-2 py-0.5 rounded font-bold">https://t.me/{tgBotInfo.bot.username}</code>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Subscriber Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-primary">{tgSubStats?.total ?? 0}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Total</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-green-600">{tgSubStats?.active ?? 0}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Active</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-orange-500">{tgSubStats?.unsubscribed ?? 0}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Unsubscribed</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-red-500">{tgSubStats?.blocked ?? 0}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Blocked</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Send - Direct Message */}
            <Card className="glass border-2 border-sky-200 dark:border-sky-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black">
                  <MessageSquare className="w-5 h-5 text-sky-500" />
                  Send Message as @bobbywealthy
                </CardTitle>
                <CardDescription>
                  Send a personal message to any Telegram user through your bot.
                  Type a @username or pick a subscriber. Messages appear with your name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Display Name</Label>
                    <Input
                      placeholder="Bobby"
                      value={tgSenderName}
                      onChange={(e) => setTgSenderName(e.target.value)}
                      className="h-12 glass border-2 font-bold"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Shown as "<strong>{tgSenderName || "You"}:</strong> your message"
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Send To</Label>
                    <Input
                      placeholder="@username or chat_id..."
                      value={tgQuickSendChatId}
                      onChange={(e) => setTgQuickSendChatId(e.target.value)}
                      className="h-12 glass border-2"
                    />
                    {tgSubscribers.length > 0 && (
                      <Select value="" onValueChange={(v) => setTgQuickSendChatId(v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Or pick a subscriber..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tgSubscribers.filter((s: any) => s.is_active && !s.is_blocked).map((sub: any) => (
                            <SelectItem key={sub.chat_id} value={sub.chat_id}>
                              {sub.first_name || "Unknown"} {sub.last_name || ""} {sub.username ? `(@${sub.username})` : `(${sub.chat_id})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</Label>
                    <Textarea
                      placeholder="Type your message here..."
                      rows={3}
                      value={tgQuickSendMessage}
                      onChange={(e) => setTgQuickSendMessage(e.target.value)}
                      className="glass border-2"
                    />
                  </div>
                </div>

                {/* Message Preview */}
                {tgQuickSendMessage.trim() && (
                  <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Preview</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {tgSenderName && <strong>{tgSenderName}:{"\n"}</strong>}
                      {tgQuickSendMessage}
                    </p>
                  </div>
                )}

                <Button
                  className="font-bold w-full md:w-auto"
                  disabled={!tgQuickSendChatId.trim() || !tgQuickSendMessage.trim() || tgQuickSendMutation.isPending}
                  onClick={() => {
                    setTgQuickSendingTo(tgQuickSendChatId);
                    tgQuickSendMutation.mutate({
                      chatId: tgQuickSendChatId,
                      message: tgQuickSendMessage,
                      senderName: tgSenderName || undefined,
                    });
                  }}
                >
                  {tgQuickSendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send as {tgSenderName || "Anonymous"}
                </Button>
              </CardContent>
            </Card>

            {/* Automated Messages */}
            <Card className="glass border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black">Automated Messages</CardTitle>
                  <CardDescription>Schedule recurring or one-time messages to your Telegram subscribers.</CardDescription>
                </div>
                <Button size="sm" className="font-bold" onClick={() => setIsTgAutoMsgDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> New Message
                </Button>
              </CardHeader>
              <CardContent>
                {tgAutoMsgLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tgAutoMessages.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-xl">
                    <Send className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">No automated messages yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Create one to start sending scheduled Telegram messages.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tgAutoMessages.map((msg: any) => (
                      <div key={msg.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm truncate">{msg.name}</span>
                            {msg.welcome_message && (
                              <Badge variant="outline" className="text-[10px] font-bold bg-sky-50 text-sky-600 border-sky-200">Welcome</Badge>
                            )}
                            {msg.is_recurring && (
                              <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-600 border-purple-200">
                                <Repeat className="w-3 h-3 mr-1" />
                                {msg.recurring_pattern || "recurring"}
                              </Badge>
                            )}
                            <Badge variant={msg.status === "active" ? "default" : "secondary"} className="text-[10px] font-bold uppercase">
                              {msg.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{msg.content?.substring(0, 100)}</p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-[10px] text-muted-foreground">Sent: {msg.total_sent || 0}</span>
                            <span className="text-[10px] text-muted-foreground">Failed: {msg.total_failed || 0}</span>
                            {msg.last_run_at && (
                              <span className="text-[10px] text-muted-foreground">Last run: {formatDistanceToNow(new Date(msg.last_run_at), { addSuffix: true })}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-bold"
                            disabled={tgSendingAutoMsg === msg.id}
                            onClick={async () => {
                              setTgSendingAutoMsg(msg.id);
                              try {
                                const res = await apiRequest("POST", `/api/marketing-center/telegram/automated-messages/${msg.id}/send`);
                                const data = await res.json();
                                toast({ title: "Sent", description: `${data.sent} sent, ${data.failed} failed out of ${data.total} subscribers.` });
                                queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/telegram/automated-messages"] });
                              } catch (err: any) {
                                toast({ title: "Error", description: err.message, variant: "destructive" });
                              } finally {
                                setTgSendingAutoMsg(null);
                              }
                            }}
                          >
                            {tgSendingAutoMsg === msg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                            Send Now
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => deleteTgAutoMsgMutation.mutate(msg.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscribers List */}
            <Card className="glass border-2">
              <CardHeader>
                <CardTitle className="text-lg font-black">Subscribers</CardTitle>
                <CardDescription>Users who have messaged your bot with /start.</CardDescription>
              </CardHeader>
              <CardContent>
                {tgSubsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tgSubscribers.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-xl">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">No subscribers yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tgBotInfo?.bot ? (
                        <>Share <code className="bg-muted px-1 py-0.5 rounded">https://t.me/{tgBotInfo.bot.username}</code> to get subscribers.</>
                      ) : (
                        "Configure your Telegram bot token to get started."
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">User</th>
                          <th className="pb-2 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Chat ID</th>
                          <th className="pb-2 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="pb-2 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Subscribed</th>
                          <th className="pb-2 font-bold text-[10px] uppercase tracking-widest text-muted-foreground"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tgSubscribers.map((sub: any) => (
                          <tr key={sub.id} className="border-b hover:bg-muted/50">
                            <td className="py-3">
                              <div>
                                <span className="font-bold">{sub.first_name || ""} {sub.last_name || ""}</span>
                                {sub.username && <span className="text-xs text-muted-foreground ml-1">@{sub.username}</span>}
                              </div>
                            </td>
                            <td className="py-3">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">{sub.chat_id}</code>
                            </td>
                            <td className="py-3">
                              {sub.is_blocked ? (
                                <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
                              ) : sub.is_active ? (
                                <Badge variant="default" className="text-[10px] bg-green-600">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">Unsubscribed</Badge>
                              )}
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {sub.subscribed_at ? formatDistanceToNow(new Date(sub.subscribed_at), { addSuffix: true }) : "-"}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] font-bold"
                                  onClick={() => {
                                    setTgQuickSendChatId(sub.chat_id);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                >
                                  <Send className="w-3 h-3 mr-1" /> Message
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => deleteTgSubscriberMutation.mutate(sub.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Telegram Automated Message Dialog */}
      <Dialog open={isTgAutoMsgDialogOpen} onOpenChange={setIsTgAutoMsgDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-500" /> New Telegram Automated Message
            </DialogTitle>
            <DialogDescription>
              Create a scheduled or recurring message for your Telegram subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">Name</Label>
              <Input
                placeholder="e.g. Weekly Tips"
                value={tgAutoMsgName}
                onChange={(e) => setTgAutoMsgName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">Message Content</Label>
              <Textarea
                placeholder="Write your Telegram message here..."
                rows={4}
                value={tgAutoMsgContent}
                onChange={(e) => setTgAutoMsgContent(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">Audience</Label>
              <Select value={tgAutoMsgAudience} onValueChange={setTgAutoMsgAudience}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_subscribers">All Subscribers</SelectItem>
                  <SelectItem value="individual">Individual Chat ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="tg-welcome"
                checked={tgAutoMsgWelcome}
                onCheckedChange={(v) => setTgAutoMsgWelcome(!!v)}
              />
              <Label htmlFor="tg-welcome" className="text-xs font-bold cursor-pointer">
                Use as welcome message (sent on /start)
              </Label>
            </div>
            {!tgAutoMsgWelcome && (
              <>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Schedule (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={tgAutoMsgScheduledAt}
                    onChange={(e) => setTgAutoMsgScheduledAt(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="tg-recurring"
                    checked={tgAutoMsgIsRecurring}
                    onCheckedChange={(v) => setTgAutoMsgIsRecurring(!!v)}
                  />
                  <Label htmlFor="tg-recurring" className="text-xs font-bold cursor-pointer">
                    Recurring message
                  </Label>
                </div>
                {tgAutoMsgIsRecurring && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Pattern</Label>
                      <Select value={tgAutoMsgPattern} onValueChange={(v: any) => setTgAutoMsgPattern(v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider">Every N</Label>
                      <Input
                        type="number"
                        min={1}
                        value={tgAutoMsgInterval}
                        onChange={(e) => setTgAutoMsgInterval(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTgAutoMsgDialogOpen(false)}>Cancel</Button>
            <Button
              className="font-bold"
              disabled={!tgAutoMsgName.trim() || !tgAutoMsgContent.trim() || createTgAutoMsgMutation.isPending}
              onClick={() => {
                createTgAutoMsgMutation.mutate({
                  name: tgAutoMsgName,
                  content: tgAutoMsgContent,
                  audience: tgAutoMsgAudience,
                  welcomeMessage: tgAutoMsgWelcome,
                  isRecurring: tgAutoMsgIsRecurring,
                  recurringPattern: tgAutoMsgIsRecurring ? tgAutoMsgPattern : null,
                  recurringInterval: tgAutoMsgIsRecurring ? tgAutoMsgInterval : null,
                  scheduledAt: tgAutoMsgScheduledAt ? new Date(tgAutoMsgScheduledAt).toISOString() : null,
                });
              }}
            >
              {createTgAutoMsgMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBroadcastId} onOpenChange={(open) => !open && setSelectedBroadcastId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recipient Delivery Details
            </DialogTitle>
            <DialogDescription>
              Full list of recipients and their delivery status for this campaign.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {recipientsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading recipient data...</p>
              </div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">No recipient records found for this broadcast.</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
                    <tr>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Recipient</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Contact</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Sent At</th>
                      <th className="text-right p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recipients.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold">
                            {r.lead_company || r.client_name || "Individual"}
                          </div>
                          {(r.lead_name) && (
                            <div className="text-[10px] text-muted-foreground">{r.lead_name}</div>
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          {r.lead_phone || r.client_phone || r.custom_recipient || "—"}
                        </td>
                        <td className="p-3">
                          {r.status === "sent" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold uppercase text-[10px]">
                              Delivered
                            </Badge>
                          ) : r.status === "completed" || r.status === "ended" ? (
                            <Badge className="bg-emerald-500 text-white font-bold uppercase text-[10px]">
                              Call Completed
                            </Badge>
                          ) : r.status === "failed" ? (
                            <div className="space-y-1">
                              <Badge variant="destructive" className="font-bold uppercase text-[10px]">
                                Failed
                              </Badge>
                              <p className="text-[10px] text-red-500 font-medium max-w-[200px] leading-tight">
                                {r.error_message}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="font-bold uppercase text-[10px]">
                              {r.status}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground tabular-nums">
                          {r.sent_at ? format(new Date(r.sent_at), "MMM d, HH:mm") : "—"}
                        </td>
                        <td className="p-3 text-right">
                          {r.provider_call_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[10px] font-bold uppercase"
                              onClick={() => window.open(`https://dashboard.vapi.ai/calls/${r.provider_call_id}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Call Logs
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setSelectedBroadcastId(null)} className="font-bold">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiGroupDialogOpen} onOpenChange={setIsAiGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Group Builder
            </DialogTitle>
            <DialogDescription>
              Find the perfect audience by describing them in natural language.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Describe your target audience</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Find all hot leads in the real estate industry in California who opted in for SMS"
                  value={aiGroupQuery}
                  onChange={(e) => setAiGroupQuery(e.target.value)}
                  className="glass border-2"
                  onKeyDown={(e) => e.key === 'Enter' && handleBuildAiGroup()}
                />
                <Button 
                  onClick={handleBuildAiGroup} 
                  disabled={isAiGroupBuilding || !aiGroupQuery.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isAiGroupBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {aiGroupPreview && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Match Found
                    </span>
                    <Badge className="bg-emerald-500 font-bold">{aiGroupPreview.preview.totalCount} Members Found</Badge>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{aiGroupPreview.explanation}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Leads Matching ({aiGroupPreview.preview.leads.length})</Label>
                    <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-900/50">
                      {aiGroupPreview.preview.leads.map((l: any) => (
                        <div key={l.id} className="text-xs p-1.5 rounded bg-white dark:bg-zinc-800 border flex justify-between items-center">
                          <span className="font-bold truncate">{l.company}</span>
                          <span className="text-[10px] text-muted-foreground">{l.name}</span>
                        </div>
                      ))}
                      {aiGroupPreview.preview.leads.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 italic">No matching leads</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clients Matching ({aiGroupPreview.preview.clients.length})</Label>
                    <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-900/50">
                      {aiGroupPreview.preview.clients.map((c: any) => (
                        <div key={c.id} className="text-xs p-1.5 rounded bg-white dark:bg-zinc-800 border">
                          <span className="font-bold truncate">{c.name}</span>
                        </div>
                      ))}
                      {aiGroupPreview.preview.clients.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 italic">No matching clients</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAiGroupDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => saveAiGroup.mutate()} 
              disabled={!aiGroupPreview || saveAiGroup.isPending || aiGroupPreview.preview.totalCount === 0}
              className="font-black tracking-widest uppercase bg-gradient-to-r from-emerald-600 to-teal-600 border-0"
            >
              {saveAiGroup.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create AI Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Marketing Copilot
            </DialogTitle>
            <DialogDescription>
              Describe what you want to say, and our AI will draft a high-converting message for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Goal / Instructions</Label>
              <Textarea 
                placeholder="e.g. Write a friendly follow-up message for a flash sale that ends in 2 hours. Mention a 20% discount."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Additional Context (Optional)</Label>
              <Input 
                placeholder="e.g. Product is a new CRM software"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary">Pro-tip:</span> The AI already knows you're sending this via <span className="font-bold uppercase">{broadcastType}</span> to <span className="font-bold uppercase">{audience === 'group' ? "a custom group" : audience}</span>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiDialogOpen(false)} disabled={isAiGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateAiContent} 
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="bg-gradient-to-r from-primary to-purple-600 border-0"
            >
              {isAiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Series Dialog */}
      <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
        <DialogContent className="sm:max-w-[500px] glass-strong border-0 shadow-2xl p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-600" />
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black uppercase">Create New Series</DialogTitle>
            <DialogDescription>Set up a multi-step automated campaign.</DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-4 space-y-4">
            <div className="space-y-2">
              <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Series Name</Label>
              <Input id="series-name" placeholder="e.g. 5-Day Welcome Sequence" className="font-bold h-12 glass border-2" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Series Type</Label>
              <Select defaultValue="email" onValueChange={(val) => {
                const el = document.getElementById('series-type-hidden') as HTMLInputElement;
                if (el) el.value = val;
              }}>
                <SelectTrigger className="h-12 font-bold glass border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email" className="font-bold">Email Series</SelectItem>
                  <SelectItem value="sms" className="font-bold">SMS Series</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" id="series-type-hidden" defaultValue="email" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Description</Label>
              <Textarea id="series-desc" placeholder="What is the goal of this sequence?" className="min-h-[100px] glass border-2" />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button variant="ghost" onClick={() => setIsSeriesDialogOpen(false)} className="font-bold uppercase text-xs tracking-widest">Cancel</Button>
            <Button 
              className="font-black bg-primary uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
              onClick={() => {
                const name = (document.getElementById('series-name') as HTMLInputElement).value;
                const type = (document.getElementById('series-type-hidden') as HTMLInputElement).value || 'email';
                const description = (document.getElementById('series-desc') as HTMLTextAreaElement).value;
                if (!name) return toast({ title: "Name required", variant: "destructive" });
                createSeriesMutation.mutate({ name, type, description });
              }}
            >
              Create Series
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Step Dialog */}
      <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
        <DialogContent className="sm:max-w-[600px] glass-strong border-0 shadow-2xl p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-600" />
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black uppercase">
              {editingStep ? 'Edit Step' : 'Add New Step'}
            </DialogTitle>
            <DialogDescription>Configure the message and delay for this step.</DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Delay Days</Label>
                <Input id="step-days" type="number" defaultValue={editingStep?.delayDays || 0} className="font-bold h-12 glass border-2" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Delay Hours</Label>
                <Input id="step-hours" type="number" defaultValue={editingStep?.delayHours || 0} className="font-bold h-12 glass border-2" />
              </div>
            </div>
            {currentSeries?.type === 'email' && (
              <div className="space-y-2">
                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Email Subject</Label>
                <Input id="step-subject" defaultValue={editingStep?.subject || ''} placeholder="e.g. Welcome to the family!" className="font-bold h-12 glass border-2" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Message Content</Label>
                <span className="text-[10px] text-muted-foreground font-medium">Use <code>{`{{name}}`}</code> for personalization</span>
              </div>
              <Textarea id="step-content" defaultValue={editingStep?.content || ''} placeholder="Write your message here..." className="min-h-[200px] font-medium glass border-2" />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button variant="ghost" onClick={() => setIsStepDialogOpen(false)} className="font-bold uppercase text-xs tracking-widest">Cancel</Button>
            <Button 
              className="font-black bg-primary uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
              onClick={() => {
                const days = parseInt((document.getElementById('step-days') as HTMLInputElement).value) || 0;
                const hours = parseInt((document.getElementById('step-hours') as HTMLInputElement).value) || 0;
                const subject = (document.getElementById('step-subject') as HTMLInputElement)?.value;
                const content = (document.getElementById('step-content') as HTMLTextAreaElement).value;
                if (!content) return toast({ title: "Content required", variant: "destructive" });
                
                const stepData = {
                  delayDays: days,
                  delayHours: hours,
                  subject,
                  content,
                  stepOrder: editingStep ? editingStep.stepOrder : (currentSeries?.steps?.length || 0)
                };

                if (editingStep) {
                  updateStepMutation.mutate({ id: editingStep.id, ...stepData });
                } else {
                  addStepMutation.mutate(stepData);
                }
              }}
            >
              {editingStep ? 'Update Step' : 'Add Step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components for Group Management
function LeadOptions() {
  const { data: leads = [] } = useQuery<any[]>({ queryKey: ["/api/leads"] });
  
  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => (a.company || a.name || "").localeCompare(b.company || b.name || ""));
  }, [leads]);

  return (
    <>
      {sortedLeads.map(l => (
        <SelectItem key={l.id} value={l.id}>
          {l.company ? `${l.company}${l.name ? ` (${l.name})` : ""}` : l.name || "Unknown Lead"}
        </SelectItem>
      ))}
      {leads.length === 0 && <SelectItem value="none" disabled>No leads found</SelectItem>}
    </>
  );
}

function ClientOptions() {
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });
  
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => (a.company || a.name || "").localeCompare(b.company || b.name || ""));
  }, [clients]);

  return (
    <>
      {sortedClients.map(c => (
        <SelectItem key={c.id} value={c.id}>
          {c.company ? `${c.company}${c.name ? ` (${c.name})` : ""}` : c.name || "Unknown Client"}
        </SelectItem>
      ))}
      {clients.length === 0 && <SelectItem value="none" disabled>No clients found</SelectItem>}
    </>
  );
}

function MemberList({ groupId, onRemove }: { groupId: string; onRemove: (id: number) => void }) {
  const { data: members = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/marketing-center/groups", groupId, "members"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/marketing-center/groups/${groupId}/members`);
      return res.json();
    }
  });

  const cachedLeads = (queryClient.getQueryData<any[]>(["/api/leads"]) || []) as any[];
  const cachedClients = (queryClient.getQueryData<any[]>(["/api/clients"]) || []) as any[];

  const { data: leads = cachedLeads } = useQuery<any[]>({
    queryKey: ["/api/leads"],
    enabled: cachedLeads.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients = cachedClients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    enabled: cachedClients.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  const membersWithNames = useMemo(() => {
    const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
    const clientMap = new Map(clients.map((client) => [client.id, client]));

    return members.map((member) => {
      const lead = leadMap.get(member.leadId);
      const client = clientMap.get(member.clientId);

        return {
        ...member,
          name: lead 
            ? `${lead.company || lead.name} (Lead)` 
            : client 
              ? `${client.company || client.name} (Client)` 
            : member.customRecipient || "Unknown"
        };
      });
  }, [members, leads, clients]);

  if (isLoading) return <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (membersWithNames.length === 0) return <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed rounded-lg">No members in this group yet.</div>;

  return (
    <div className="space-y-2">
      {membersWithNames.map((m) => (
        <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50 group">
          <span className="font-medium text-sm">{m.name}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(m.id)}
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

