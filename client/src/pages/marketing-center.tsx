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
  UserMinus
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
  const [broadcastType, setBroadcastType] = useState<"email" | "sms" | "whatsapp" | "telegram">("email");
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

  // Group Management State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<MarketingGroup | null>(null);
  
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
    mutationFn: async ({ groupId, leadId, clientId }: { groupId: string; leadId?: string; clientId?: string }) => {
      const res = await apiRequest("POST", `/api/marketing-center/groups/${groupId}/members`, { leadId, clientId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/groups", selectedGroupForMembers?.id, "members"] });
      toast({ title: "Member Added" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("DELETE", `/api/marketing-center/groups/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/groups", selectedGroupForMembers?.id, "members"] });
      toast({ title: "Member Removed" });
    },
  });

  const handleSend = () => {
    if (!content.trim()) {
      toast({ title: "Content Required", description: "Please enter your message.", variant: "destructive" });
      return;
    }
    if (broadcastType === 'email' && !subject.trim()) {
      toast({ title: "Subject Required", description: "Please enter an email subject.", variant: "destructive" });
      return;
    }
    if (audience === 'individual' && !customRecipient.trim()) {
      toast({ title: "Recipient Required", description: `Please enter a recipient ${broadcastType === 'email' ? 'email' : broadcastType === 'telegram' ? 'chat_id' : 'phone number'}.`, variant: "destructive" });
      return;
    }
    // Telegram broadcasts only support "Send to Individual" (a single group/channel chat_id)
    if (broadcastType === "telegram" && audience !== "individual") {
      toast({ title: "Telegram Target Required", description: "For Telegram, choose 'Send to Individual' and paste the group/channel chat_id.", variant: "destructive" });
      return;
    }

    // If we're using audience stats, don't allow sending while stats are unavailable.
    if ((audience === "all" || audience === "leads" || audience === "clients") && broadcastType !== "telegram") {
      if (statsLoading) {
        toast({ title: "Loading audience…", description: "Please wait for audience stats to load before sending.", variant: "destructive" });
        return;
      }
      if (statsIsError || !stats) {
        toast({ title: "Audience unavailable", description: "Could not load leads/clients from the database. Check DB status or refresh.", variant: "destructive" });
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
      scheduledAt: sendMode === "scheduled" ? new Date(scheduledAtLocal).toISOString() : null,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : null,
      recurringInterval: isRecurring ? recurringInterval : 1,
      recurringEndDate: isRecurring && recurringEndDateLocal ? new Date(recurringEndDateLocal).toISOString() : null,
    });
  };

  const getRecipientCount = () => {
    if (audience === 'individual') return customRecipient ? 1 : 0;
    if (audience === 'group') {
      // Note: This is a rough estimate since group members might overlap with leads/clients
      // In a real app, you'd fetch the exact count from the server
      return 0; // We'll show "Group Selected" instead
    }
    if (!stats) return 0;
    if (audience === 'all') return stats.leads.optedIn + stats.clients.optedIn;
    if (audience === 'leads') return stats.leads.optedIn;
    if (audience === 'clients') return stats.clients.optedIn;
    return 0;
  };

  const totalReachDisplay = statsLoading
    ? "—"
    : statsIsError
      ? "—"
      : String((stats?.leads.optedIn || 0) + (stats?.clients.optedIn || 0));

  const statsErrorMessage = statsIsError
    ? ((statsError as any)?.message ?? "Failed to load audience stats")
    : null;

  return (
    <div className="min-h-full p-4 md:p-8 lg:p-12 space-y-8 bg-zinc-50/50 dark:bg-zinc-950/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient-purple">Marketing Center</h1>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Broadcast mass communications to your audience</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <Card className="glass px-6 py-3 border-primary/20 flex items-center gap-4 shadow-xl">
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Reach</p>
              <p className="text-2xl font-black text-primary tabular-nums">{totalReachDisplay}</p>
              {statsIsError && (
                <button
                  type="button"
                  className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline"
                  onClick={() => dbStatusMutation.mutate()}
                  title={statsErrorMessage ?? undefined}
                >
                  Stats error — check DB
                </button>
              )}
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
            <Users className="w-6 h-6 text-primary/60" />
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
        <TabsList className="glass p-1 bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-12 inline-flex items-center">
          <TabsTrigger value="composer" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </TabsTrigger>
          <TabsTrigger value="history" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
            <History className="w-4 h-4 mr-2" /> History & Status
          </TabsTrigger>
          <TabsTrigger value="groups" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
            <Users className="w-4 h-4 mr-2" /> Groups
          </TabsTrigger>
          <TabsTrigger value="sms-inbox" className="h-10 px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md">
            <MessageSquare className="w-4 h-4 mr-2" /> SMS Inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="composer" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Configuration */}
            <div className="lg:col-span-8 space-y-8">
              <Card className="glass-strong border-0 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
                <CardHeader className="border-b bg-white/50 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                      <Target className="w-6 h-6 text-primary" /> Campaign Details
                    </CardTitle>
                      <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
                        <Button 
                          variant={broadcastType === 'email' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('email')}
                          className="font-bold h-8"
                        >
                          <Mail className="w-4 h-4 mr-2" /> Email
                        </Button>
                        <Button 
                          variant={broadcastType === 'sms' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('sms')}
                          className="font-bold h-8"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" /> SMS
                        </Button>
                        <Button 
                          variant={broadcastType === 'whatsapp' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setBroadcastType('whatsapp')}
                          className="font-bold h-8"
                        >
                          <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" /> WhatsApp
                        </Button>
                      <Button 
                        variant={broadcastType === 'telegram' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setBroadcastType('telegram')}
                        className="font-bold h-8"
                      >
                        <MessageSquare className="w-4 h-4 mr-2 text-sky-500" /> Telegram
                      </Button>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6 relative">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Audience</Label>
                      <Select value={audience} onValueChange={setAudience}>
                        <SelectTrigger className="h-12 glass border-2">
                          <SelectValue placeholder="Target Audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers (Leads + Clients)</SelectItem>
                          <SelectItem value="leads">Leads Only</SelectItem>
                          <SelectItem value="clients">Clients Only</SelectItem>
                          <SelectItem value="group">Custom Group</SelectItem>
                          <SelectItem value="individual">Send to Individual</SelectItem>
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
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Message Content</Label>
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
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Segments: {Math.ceil(content.length / 160)}</p>
                        <p className={`text-xs font-bold ${content.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>{content.length} / 160 characters</p>
                      </div>
                    )}
                  </div>
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
                      <Badge className="font-black uppercase">{broadcastType}</Badge>
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
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
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
                    <div className="flex flex-col md:flex-row md:items-center">
                      {/* Left: Type Icon */}
                      <div className={`w-full md:w-32 h-20 md:h-auto flex items-center justify-center ${broadcast.type === 'email' ? 'bg-blue-500/10' : broadcast.type === 'whatsapp' ? 'bg-emerald-500/10' : 'bg-green-500/10'}`}>
                        {broadcast.type === 'email' ? (
                          <Mail className="w-8 h-8 text-blue-500" />
                        ) : broadcast.type === 'whatsapp' ? (
                          <MessageSquare className="w-8 h-8 text-emerald-500" />
                        ) : broadcast.type === 'telegram' ? (
                          <MessageSquare className="w-8 h-8 text-sky-500" />
                        ) : (
                          <MessageSquare className="w-8 h-8 text-green-500" />
                        )}
                      </div>

                      {/* Center: Content */}
                      <div className="flex-1 p-6 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold truncate max-w-[300px]">
                            {broadcast.type === 'email' ? broadcast.subject : broadcast.content.substring(0, 50) + '...'}
                          </h3>
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

                          {/* Always-visible diagnostics button (mobile-friendly) */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[10px] font-black uppercase tracking-widest"
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
                      <div className="p-6 md:w-80 border-t md:border-t-0 md:border-l bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-2xl font-black">{broadcast.successCount}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Successful</p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-lg font-bold text-zinc-400">/ {broadcast.totalRecipients}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                            </div>
                          </div>
                          <Progress 
                            value={broadcast.totalRecipients ? (broadcast.successCount! / broadcast.totalRecipients) * 100 : 0} 
                            className="h-2 bg-zinc-200 dark:bg-zinc-800"
                          />
                          {broadcast.failedCount! > 0 && (
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-widest">
                                <AlertCircle className="w-3 h-3" /> {broadcast.failedCount} Failed Deliveries
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-black uppercase tracking-widest"
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
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-xl font-bold">Create New Group</CardTitle>
                  <CardDescription>Group recipients for targeted campaigns</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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

                                  <div className="space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Members</Label>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                      <MemberList groupId={group.id} onRemove={(id) => removeMemberMutation.mutate(id)} />
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
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
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
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="font-bold"
                          onClick={() => {
                            setBroadcastType(m.dialpad_id ? "sms" : "whatsapp"); // If it has dialpad_id, it's definitely SMS. In reality we'd need a field for channel
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
      </Tabs>

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
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
                    <tr>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Recipient</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Contact</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Sent At</th>
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
    </div>
  );
}

// Helper Components for Group Management
function LeadOptions() {
  const { data: leads = [] } = useQuery<any[]>({ queryKey: ["/api/leads"] });
  return (
    <>
      {leads.map(l => (
        <SelectItem key={l.id} value={l.id}>{l.company} ({l.name})</SelectItem>
      ))}
      {leads.length === 0 && <SelectItem value="none" disabled>No leads found</SelectItem>}
    </>
  );
}

function ClientOptions() {
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });
  return (
    <>
      {clients.map(c => (
        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
      const rawMembers = await res.json();
      
      // Fetch names for leads/clients
      // In a production app, the server would join these
      const leadRes = await apiRequest("GET", "/api/leads");
      const clientRes = await apiRequest("GET", "/api/clients");
      const allLeads = await leadRes.json();
      const allClients = await clientRes.json();

      return rawMembers.map((m: any) => {
        const lead = allLeads.find((l: any) => l.id === m.leadId);
        const client = allClients.find((c: any) => c.id === m.clientId);
        return {
          ...m,
          name: lead ? `${lead.company} (Lead)` : client ? `${client.name} (Client)` : "Unknown"
        };
      });
    }
  });

  if (isLoading) return <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (members.length === 0) return <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed rounded-lg">No members in this group yet.</div>;

  return (
    <div className="space-y-2">
      {members.map((m) => (
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

