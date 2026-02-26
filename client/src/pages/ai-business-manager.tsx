import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Bot, Send, Loader2, AlertCircle, CheckCircle2, Sparkles, Zap, MessageSquare, Mic, MicOff, Calendar as CalendarIcon, Clock, Trash2, Plus, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/errorHandler";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resolveApiUrl } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type ScheduledAiCommand } from "@shared/schema";

interface Message {
  id: string;
  role: "user" | "assistant" | "error" | "success";
  content: string;
  timestamp: Date;
  actionTaken?: string;
  errorDetails?: string;
}

export default function AIBusinessManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hey there! 👋 I'm so excited to help you out today!\n\nThink of me as your personal assistant who never sleeps, never gets tired, and is ALWAYS ready to help. Whether you need to text a client, schedule a meeting, create an invoice, or just want to know what's on your plate today - I've got your back! 💪\n\nSo, what can I help you with? Just talk to me like you would a friend - no fancy commands needed! 😊`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [recurringPattern, setRecurringPattern] = useState<string>("none");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if user is admin
  useEffect(() => {
    if (user && (user as any).role !== "admin") {
      toast({
        title: "Access Denied",
        description: "This feature is only available for administrators.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const streamChat = async (userMessage: string, assistantMessageId: string) => {
    const conversationHistory = messages
      .slice(-10)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    const res = await fetch(resolveApiUrl("/api/ai-business-manager/chat-stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory,
      }),
      credentials: "include",
    });

    if (!res.ok) {
      // Reuse existing apiRequest error parsing when possible
      try {
        const fallback = await apiRequest("POST", "/api/ai-business-manager/chat", {
          message: userMessage,
          conversationHistory,
        });
        const data = await fallback.json();
        throw new Error(data?.error || data?.message || "Request failed");
      } catch (e: any) {
        throw new Error(e?.message || "Request failed");
      }
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("Streaming not supported by this browser");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        let event: any;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }

        if (event.type === "delta") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: (m.content || "") + String(event.content || "") } : m
            )
          );
        } else if (event.type === "action" && event.actionTaken) {
          const successMessage: Message = {
            id: `${Date.now()}-success`,
            role: "success",
            content: `✅ Successfully: ${event.actionTaken}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, successMessage]);
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, role: "error", content: m.content || `❌ ${event.error || "Error"}`, errorDetails: event.errorDetails }
                : m
            )
          );
        }
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || user?.role !== "admin") return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    const assistantId = `${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      await streamChat(userText, assistantId);
    } catch (error: any) {
      logError(error, "AI chat streaming");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, role: "error", content: `❌ ${error?.message || "Unknown error"}` } : m
        )
      );
      toast({
        title: "Error",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      logError(error, "Microphone access");
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await apiRequest("POST", "/api/ai-business-manager/transcribe", formData);
      const data = await response.json();
      
      if (data.success && data.text) {
        setInput(data.text);
        inputRef.current?.focus();
      } else {
        toast({
          title: "Transcription Failed",
          description: data.error || "Could not transcribe audio",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      logError(error, "Audio transcription");
      toast({
        title: "Transcription Error",
        description: error?.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const { data: scheduledCommands = [], isLoading: isLoadingScheduled } = useQuery<ScheduledAiCommand[]>({
    queryKey: ["/api/ai-business-manager/scheduled-commands"],
  });

  const createScheduledCommand = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai-business-manager/scheduled-commands", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-business-manager/scheduled-commands"] });
      toast({ title: "Success", description: "AI command scheduled successfully!" });
      setIsScheduleDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteScheduledCommand = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ai-business-manager/scheduled-commands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-business-manager/scheduled-commands"] });
      toast({ title: "Success", description: "Scheduled command deleted" });
    },
  });

  const handleScheduleSubmit = () => {
    if (!input.trim() || !scheduledDate) return;

    createScheduledCommand.mutate({
      command: input.trim(),
      scheduledAt: scheduledDate.toISOString(),
      isRecurring: recurringPattern !== "none",
      recurringPattern: recurringPattern !== "none" ? recurringPattern : null,
      recurringInterval: 1,
    });
  };

  const quickActions = [
    { label: "Show all clients", prompt: "Hey, can you show me all my clients?" },
    { label: "Create a task", prompt: "I need to create a new task" },
    { label: "Check messages", prompt: "Any new messages for me?" },
    { label: "View calendar", prompt: "What's on my schedule today?" },
    { label: "List campaigns", prompt: "Show me what campaigns are running" },
    { label: "Create invoice", prompt: "Help me create an invoice" },
  ];

  if (!user || (user as any).role !== "admin") {
    return (
      <div className="min-h-full gradient-mesh flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              This feature is only available for administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gradient-purple">
                AI Business Manager
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Your friendly AI sidekick - here to make your work life easier! ✨
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Chat Interface */}
          <Card className="lg:col-span-2 shadow-xl border-0 glass-strong flex flex-col h-[calc(100vh-12rem)]">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 md:p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {message.role !== "user" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                          {message.role === "error" ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          ) : message.role === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Bot className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      )}
                      <div
                        className={`flex-1 max-w-[80%] min-w-0 ${
                          message.role === "user" ? "items-end" : "items-start"
                        } flex flex-col`}
                      >
                        <div
                          className={`rounded-2xl p-3 md:p-4 break-words overflow-hidden ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : message.role === "error"
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : message.role === "success"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          {message.errorDetails && (
                            <Alert variant="destructive" className="mt-3">
                              <AlertCircle className="w-4 h-4" />
                              <AlertDescription className="text-xs">
                                {message.errorDetails}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        {message.actionTaken && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {message.actionTaken}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                      <div className="bg-muted rounded-2xl p-4">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 md:p-6 border-t border-border/50">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isRecording ? "🎤 Listening..." : isTranscribing ? "✨ Transcribing..." : "Type or click the mic to speak..."}
                    disabled={isProcessing || isRecording || isTranscribing}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isProcessing || isTranscribing}
                    variant={isRecording ? "destructive" : "outline"}
                    className={isRecording ? "animate-pulse" : ""}
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!input.trim() || isProcessing}
                        className="gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        <span className="hidden md:inline">Schedule</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule AI Command</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Command</Label>
                          <div className="p-3 rounded-lg bg-muted text-sm italic">
                            "{input}"
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Run Date & Time</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !scheduledDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduledDate ? format(scheduledDate, "PPP p") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={scheduledDate}
                                onSelect={setScheduledDate}
                                initialFocus
                              />
                              <div className="p-3 border-t border-border">
                                <Input
                                  type="time"
                                  value={scheduledDate ? format(scheduledDate, "HH:mm") : "09:00"}
                                  onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(":");
                                    const newDate = new Date(scheduledDate || new Date());
                                    newDate.setHours(parseInt(hours), parseInt(minutes));
                                    setScheduledDate(newDate);
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Recurrence</Label>
                          <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Once</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleScheduleSubmit}
                          disabled={createScheduledCommand.isPending}
                        >
                          {createScheduledCommand.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Schedule Run
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="submit"
                    disabled={!input.trim() || isProcessing || isRecording || isTranscribing}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Info Sidebar */}
          <Card className="shadow-xl border-0 glass-strong">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="space-y-2">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setInput(action.prompt);
                      inputRef.current?.focus();
                    }}
                    disabled={isProcessing}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Scheduled Commands List */}
              <div className="pt-6 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Scheduled Runs
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {scheduledCommands.length}
                  </Badge>
                </div>
                
                <ScrollArea className="h-[200px] -mx-2 px-2">
                  <div className="space-y-2">
                    {isLoadingScheduled ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : scheduledCommands.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4 italic">
                        No scheduled commands yet
                      </p>
                    ) : (
                      scheduledCommands.map((cmd) => (
                        <div key={cmd.id} className="p-2 rounded-lg bg-muted/50 border border-border/50 space-y-1 group relative">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-medium line-clamp-2">{cmd.command}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteScheduledCommand.mutate(cmd.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{format(new Date(cmd.nextRunAt || cmd.scheduledAt), "MMM d, h:mm a")}</span>
                            {cmd.isRecurring && (
                              <Badge variant="outline" className="text-[8px] h-3 px-1 gap-0.5">
                                <Repeat className="w-2 h-2" />
                                {cmd.recurringPattern}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                <h3 className="font-semibold text-sm">Here's what I can help you with:</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>📞 Call or text your clients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>📅 Manage your calendar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>💬 Send team messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>🚀 Launch campaigns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>✅ Create & track tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>💰 Generate invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>📊 Track analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>👥 Manage your team</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic pt-2">
                  💡 Tip: Just ask naturally - I understand context!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
