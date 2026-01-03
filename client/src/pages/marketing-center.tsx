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
import { formatDistanceToNow } from "date-fns";
import type { MarketingBroadcast } from "@shared/schema";

export default function MarketingCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("composer");
  const [broadcastType, setBroadcastType] = useState<"email" | "sms">("email");
  const [audience, setAudience] = useState("all");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  
  // Marketing Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/marketing-center/stats"],
  });

  // Broadcast History Query
  const { data: broadcasts, isLoading: historyLoading } = useQuery<MarketingBroadcast[]>({
    queryKey: ["/api/marketing-center/broadcasts"],
    refetchInterval: (data) => {
      // Refresh frequently if any broadcast is still sending
      return data?.some(b => b.status === 'sending') ? 3000 : false;
    }
  });

  // Send Broadcast Mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/marketing-center/broadcast", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-center/broadcasts"] });
      toast({
        title: "🚀 Broadcast Started",
        description: "Your messages are being queued for delivery.",
      });
      setActiveTab("history");
      // Reset form
      setSubject("");
      setContent("");
    },
    onError: (error: any) => {
      toast({
        title: "Broadcast Failed",
        description: error.message || "Failed to start marketing campaign.",
        variant: "destructive"
      });
    }
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

    sendBroadcastMutation.mutate({
      type: broadcastType,
      audience,
      subject: broadcastType === 'email' ? subject : null,
      content,
      status: 'sending'
    });
  };

  const getRecipientCount = () => {
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
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sender Account</Label>
                      <Input 
                        disabled 
                        value={broadcastType === 'email' ? "business@wolfpaqmarketing.app" : "Twilio Official"} 
                        className="h-12 glass border-2 font-semibold text-primary"
                      />
                    </div>
                  </div>

                  {broadcastType === 'email' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email Subject</Label>
                      <Input 
                        placeholder="Exciting updates from Wolfpaq Marketing..." 
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
                      <span className="font-black">Now (Instant)</span>
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
                            {broadcast.audience}
                          </Badge>
                          {broadcast.status === 'sending' ? (
                            <Badge className="bg-primary animate-pulse font-black uppercase text-[10px]">Sending...</Badge>
                          ) : broadcast.status === 'completed' ? (
                            <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px]">Completed</Badge>
                          ) : (
                            <Badge variant="destructive" className="font-black uppercase text-[10px]">{broadcast.status}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          <Zap className="w-3 h-3" /> Sent {formatDistanceToNow(new Date(broadcast.createdAt!), { addSuffix: true })}
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
                            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-widest">
                              <AlertCircle className="w-3 h-3" /> {broadcast.failedCount} Failed Deliveries
                            </p>
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
      </Tabs>
    </div>
  );
}

