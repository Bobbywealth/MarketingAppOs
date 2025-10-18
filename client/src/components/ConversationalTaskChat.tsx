import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, Send, X, Check, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, Client } from "@shared/schema";

interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

interface TaskData {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  assignedToId?: number;
  clientId?: string;
}

interface ConversationalTaskChatProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

export function ConversationalTaskChat({ isOpen, onClose, onTaskCreated }: ConversationalTaskChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "👋 Hi! I'm your AI Task Assistant. I'll help you create a task. What would you like to work on?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [taskData, setTaskData] = useState<TaskData>({});
  const [currentStep, setCurrentStep] = useState<"title" | "details" | "priority" | "dueDate" | "assignee" | "confirm">("title");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
    meta: { returnNull: true },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: "ai" | "user", content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  };

  const parseAIResponse = async (userInput: string) => {
    setIsProcessing(true);
    addMessage("user", userInput);

    // Simulate thinking
    await new Promise((resolve) => setTimeout(resolve, 500));

    switch (currentStep) {
      case "title":
        setTaskData((prev) => ({ ...prev, title: userInput, status: "todo" }));
        addMessage("ai", `Great! I'll create a task called "${userInput}". Would you like to add a description or any details? (You can say "no" to skip)`);
        setCurrentStep("details");
        break;

      case "details":
        if (userInput.toLowerCase().includes("no") || userInput.toLowerCase().includes("skip")) {
          addMessage("ai", "No problem! How urgent is this task? Please choose: **Low**, **Normal**, **High**, or **Urgent**");
          setCurrentStep("priority");
        } else {
          setTaskData((prev) => ({ ...prev, description: userInput }));
          addMessage("ai", "Perfect! I've noted that. How urgent is this task? Choose: **Low**, **Normal**, **High**, or **Urgent**");
          setCurrentStep("priority");
        }
        break;

      case "priority":
        const priority = userInput.toLowerCase().includes("urgent") ? "urgent" :
                        userInput.toLowerCase().includes("high") ? "high" :
                        userInput.toLowerCase().includes("low") ? "low" : "normal";
        setTaskData((prev) => ({ ...prev, priority }));
        addMessage("ai", `Got it, set to **${priority}** priority. When is this due? (e.g., "tomorrow", "next Monday", "12/31/2024", or "no due date")`);
        setCurrentStep("dueDate");
        break;

      case "dueDate":
        if (userInput.toLowerCase().includes("no") || userInput.toLowerCase().includes("skip")) {
          addMessage("ai", `No due date set. ${users.length > 0 ? "Who should work on this? Please type their name or say 'me' or 'skip'" : "Almost done! Let me create this task for you."}`);
          setCurrentStep(users.length > 0 ? "assignee" : "confirm");
        } else {
          // Parse date with AI
          try {
            const response = await apiRequest("POST", "/api/tasks/parse-ai", { 
              input: `Parse this date: "${userInput}". Today is ${new Date().toLocaleDateString()}` 
            });
            const parsed = await response.json();
            if (parsed.dueDate) {
              setTaskData((prev) => ({ ...prev, dueDate: parsed.dueDate }));
              addMessage("ai", `Perfect! Due date set to **${new Date(parsed.dueDate).toLocaleDateString()}**. ${users.length > 0 ? "Who should work on this? Type their name or say 'me' or 'skip'" : "Let me create this task now!"}`);
              setCurrentStep(users.length > 0 ? "assignee" : "confirm");
            } else {
              addMessage("ai", "I couldn't parse that date. Could you try again? (e.g., '2024-12-25' or 'tomorrow')");
            }
          } catch {
            addMessage("ai", "Let me set that for you. Moving on! Who should work on this? Type their name or say 'skip'");
            setCurrentStep("assignee");
          }
        }
        break;

      case "assignee":
        if (userInput.toLowerCase().includes("skip") || userInput.toLowerCase().includes("no")) {
          addMessage("ai", "No problem! Let me create this task now. ✨");
          setCurrentStep("confirm");
          await createTask();
        } else if (userInput.toLowerCase().includes("me")) {
          // Assign to current user (you'd need to get current user ID)
          addMessage("ai", "Assigning to you! Creating task now... ✨");
          setCurrentStep("confirm");
          await createTask();
        } else {
          // Find user by name
          const matchedUser = users.find(u => 
            u.username?.toLowerCase().includes(userInput.toLowerCase())
          );
          if (matchedUser) {
            setTaskData((prev) => ({ ...prev, assignedToId: matchedUser.id }));
            addMessage("ai", `Perfect! Assigning to **${matchedUser.username}**. Creating your task now! ✨`);
            setCurrentStep("confirm");
            await createTask();
          } else {
            addMessage("ai", `I couldn't find "${userInput}". Available users: ${users.map(u => u.username).join(", ")}. Try again or say "skip"`);
          }
        }
        break;

      case "confirm":
        await createTask();
        break;
    }

    setIsProcessing(false);
    setInput("");
  };

  const createTask = async () => {
    try {
      console.log("🔄 Attempting to create task with data:", taskData);
      
      // Ensure required fields have values
      const taskPayload = {
        title: taskData.title || "Untitled Task",
        status: taskData.status || "todo",
        priority: taskData.priority || "normal",
        description: taskData.description || null,
        dueDate: taskData.dueDate || null,
        assignedToId: taskData.assignedToId || null,
        clientId: taskData.clientId || null,
      };
      
      console.log("📤 Sending task payload:", taskPayload);
      
      const response = await apiRequest("POST", "/api/tasks", taskPayload);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Server error:", errorData);
        throw new Error(errorData.message || "Failed to create task");
      }
      
      const task = await response.json();
      console.log("✅ Task created:", task);
      
      addMessage("ai", `✅ **Task created successfully!** "${task.title}" is now in your task list. Need anything else?`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "✅ Task created!",
        description: `"${task.title}" has been added to your tasks.`,
      });

      if (onTaskCreated) {
        onTaskCreated();
      }

      // Reset after 2 seconds
      setTimeout(() => {
        resetChat();
      }, 2000);
    } catch (error: any) {
      console.error("❌ Task creation error:", error);
      const errorMessage = error?.message || "Unknown error";
      addMessage("ai", `❌ Oops! Something went wrong: ${errorMessage}. Want to try again?`);
      
      toast({
        title: "Failed to create task",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: "ai",
        content: "👋 Hi! I'm your AI Task Assistant. What would you like to work on next?",
        timestamp: new Date(),
      },
    ]);
    setTaskData({});
    setCurrentStep("title");
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice input failed",
        description: "Could not capture your voice. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    parseAIResponse(input);
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-6 md:right-6 md:w-[420px] h-[600px] max-h-[80vh] shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 flex flex-col z-[9999]">
      <CardHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <h3 className="font-semibold">AI Task Assistant</h3>
              <p className="text-xs text-muted-foreground">Let's create your task together!</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === "ai"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-medium text-sm">
                  You
                </div>
              )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-2.5">
                <div className="flex gap-2 items-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Current task preview */}
      {taskData.title && (
        <div className="px-4 py-2 border-t bg-muted/30 flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Creating:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {taskData.title}
            </Badge>
            {taskData.priority && (
              <Badge variant="secondary" className="text-xs">
                {taskData.priority}
              </Badge>
            )}
            {taskData.dueDate && (
              <Badge variant="secondary" className="text-xs">
                Due: {new Date(taskData.dueDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardContent className="p-4 border-t flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleVoiceInput}
            disabled={isProcessing}
            className={`flex-shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type your answer..."}
            disabled={isProcessing || isListening}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isProcessing || isListening}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🎤 Voice input or type naturally - I'll guide you through!
        </p>
      </CardContent>
    </Card>
  );
}

