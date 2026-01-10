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
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import type { MarketingBroadcast } from "@shared/schema";

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
  const [broadcastType, setBroadcastType] = useState<"email" | "sms">("email");
  const [audience, setAudience] = useState("all");
  const [customRecipient, setCustomRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [scheduledAtLocal, setScheduledAtLocal] = useState(""); // datetime-local value (local TZ)
  
  // Marketing Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery<MarketingCenterStats>({
    queryKey: ["/api/marketing-center/stats"],
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

  const viewFailuresMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await apiRequest("GET", `/api/marketing-center/broadcasts/${broadcastId}/recipients`, undefined);
      return (await res.json()) as BroadcastRecipientRow[];
    },
    onSuccess: (rows) => {
      const failed = rows.filter((r) => r.status === "failed");
      if (failed.length === 0) {
        toast({ title: "No failures found", description: "All recipients show as sent (or pending)." });
        return;
      }

      const counts = new Map<string, number>();
      for (const r of failed) {
        const key = (r.error_message || "Unknown error").trim();
        counts.set(key, (counts.get(key) || 0) + 1);
      }

      const top = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([msg, count]) => `${count}× ${msg}`)
        .join(" | ");

      toast({
        title: `Failed deliveries: ${failed.length}`,
        description: top,
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to load failures",
        description: error.message || "Could not fetch broadcast recipient details.",
        variant: "destructive",
      });
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
      toast({ title: "Recipient Required", description: `Please enter a recipient ${broadcastType === 'email' ? 'email' : 'phone number'}.`, variant: "destructive" });
      return;
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
      customRecipient: audience === 'individual' ? customRecipient : null,
      subject: broadcastType === 'email' ? subject : null,
      content,
      scheduledAt: sendMode === "scheduled" ? new Date(scheduledAtLocal).toISOString() : null,
    });
  };

  const getRecipientCount = () => {
    if (audience === 'individual') return customRecipient ? 1 : 0;
    if (!stats) return 0;
    if (audience === 'all') return stats.leads.optedIn + stats.clients.optedIn;
    if (audience === 'leads') return stats.leads.optedIn;
    if (audience === 'clients') return stats.clients.optedIn;
    return 0;
  };

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
              <p className="text-2xl font-black text-primary">{(stats?.leads.optedIn || 0) + (stats?.clients.optedIn || 0)}</p>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
            <Users className="w-6 h-6 text-primary/60" />
          </Card>
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
                          <SelectItem value="individual">Send to Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {audience === 'individual' ? (
                      <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          {broadcastType === 'email' ? 'Recipient Email' : 'Recipient Phone Number'}
                        </Label>
                        <Input 
                          placeholder={broadcastType === 'email' ? "hello@example.com" : "+1234567890"}
                          value={customRecipient}
                          onChange={(e) => setCustomRecipient(e.target.value)}
                          className="h-12 glass border-2 font-semibold"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sender Account</Label>
                        <Input 
                          disabled 
                          value={broadcastType === 'email' ? "business@marketingteam.app" : "Twilio Official"} 
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
                      placeholder={broadcastType === 'email' ? "Write your premium marketing email here (HTML supported)..." : "Write your concise SMS message here..."}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[300px] glass border-2 resize-none text-lg leading-relaxed focus-visible:ring-primary/20"
                    />
                    {broadcastType === 'sms' && (
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
                        <span className="text-lg font-black">{getRecipientCount()}</span>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">People Reachable</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-muted-foreground font-medium">Schedule</span>
                      <span className="font-black">
                        {sendMode === "scheduled" && scheduledAtLocal
                          ? format(new Date(scheduledAtLocal), "PPpp")
                          : "Now (Instant)"}
                      </span>
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
          <div className="grid gap-6">
            {!broadcasts || broadcasts.length === 0 ? (
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
              broadcasts.map((broadcast) => (
                <motion.div
                  key={broadcast.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass hover:shadow-xl transition-all duration-300 border-primary/10 overflow-hidden group">
                    <div className="flex flex-col md:flex-row md:items-center">
                      {/* Left: Type Icon */}
                      <div className={`w-full md:w-32 h-20 md:h-auto flex items-center justify-center ${broadcast.type === 'email' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                        {broadcast.type === 'email' ? (
                          <Mail className="w-8 h-8 text-blue-500" />
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-black uppercase tracking-widest"
                            onClick={() => viewFailuresMutation.mutate(broadcast.id)}
                            disabled={viewFailuresMutation.isPending || !(broadcast.failedCount && broadcast.failedCount > 0)}
                            title={broadcast.failedCount && broadcast.failedCount > 0 ? "View failure reasons" : "No failures to show"}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {viewFailuresMutation.isPending ? "Loading..." : "View failures"}
                          </Button>
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
                                onClick={() => viewFailuresMutation.mutate(broadcast.id)}
                                disabled={viewFailuresMutation.isPending}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                {viewFailuresMutation.isPending ? "Loading..." : "View failures"}
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
                          setBroadcastType("sms");
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
    </div>
  );
}

