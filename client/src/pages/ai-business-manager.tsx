import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, AlertCircle, CheckCircle2, Sparkles, Zap, MessageSquare, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

    const res = await fetch("/api/ai-business-manager/chat-stream", {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

