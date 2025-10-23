import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, Send, X, Check, Mic, MicOff, Image as ImageIcon, Trash2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { parseInputDateEST } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, Client, Task } from "@shared/schema";

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
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringInterval?: number;
  recurringEndDate?: string;
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
      content: "Hey there! 👋 I'm your task assistant - think of me as your personal productivity buddy! 🚀\n\nJust tell me what you need to do in plain English, and I'll handle the rest. I can:\n\n✨ Create tasks from casual language\n📋 Add multiple tasks at once\n🖼️ Read screenshots or photos\n🗑️ Delete tasks you don't need\n\n**Try saying:**\n• \"Call Sarah tomorrow afternoon\"\n• \"Finish the proposal by Friday - high priority\"\n• \"Delete the old meeting task\"\n• Or just upload a screenshot!\n\nWhat's on your mind today? 😊",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [taskData, setTaskData] = useState<TaskData>({});
  const [bulkTasks, setBulkTasks] = useState<TaskData[]>([]);
  const [currentStep, setCurrentStep] = useState<"title" | "details" | "priority" | "dueDate" | "assignee" | "confirm">("title");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
    meta: { returnNull: true },
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleImageUpload(imageFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please drop an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      toast({
        title: "📷 Image uploaded!",
        description: "Tell me what you want to do with this image",
      });
    };
    reader.readAsDataURL(file);
  };

  const addMessage = (role: "ai" | "user", content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  };

  const parseAIResponse = async (userInput: string, imageData?: string) => {
    setIsProcessing(true);
    addMessage("user", userInput + (imageData ? " 📷" : ""));

    try {
      const lowerInput = userInput.toLowerCase().trim();
      
      // Check for greetings - respond naturally!
      const greetings = ["hi", "hello", "hey", "sup", "what's up", "whats up", "yo", "hola", "good morning", "good afternoon", "good evening"];
      if (greetings.includes(lowerInput) || greetings.some(g => lowerInput === g || lowerInput.startsWith(g + " ") || lowerInput.startsWith(g + "!"))) {
        const responses = [
          "Hey there! 👋 What task can I help you create today?",
          "Hi! 😊 Ready to knock out some tasks? What's on your mind?",
          "Hello! ✨ What do you need to get done?",
          "Hey! 🚀 Tell me what you're working on and I'll help organize it!",
          "What's up! 👊 Got some tasks to add? Just tell me what you need!"
        ];
        addMessage("ai", responses[Math.floor(Math.random() * responses.length)]);
        setIsProcessing(false);
        setInput("");
        return;
      }

      // Check for thank you / appreciation
      const thanks = ["thanks", "thank you", "thx", "ty", "appreciate", "awesome", "great", "perfect"];
      if (thanks.some(t => lowerInput.includes(t)) && lowerInput.split(' ').length <= 4) {
        const responses = [
          "You're welcome! 😊 Anything else you need?",
          "Happy to help! 🙌 What else can I do for you?",
          "No problem! ✨ Ready for another task?",
          "Glad I could help! 💪 What's next?",
        ];
        addMessage("ai", responses[Math.floor(Math.random() * responses.length)]);
        setIsProcessing(false);
        setInput("");
        return;
      }

      // Check if this is a delete request
      const deleteKeywords = ["delete", "remove", "cancel", "drop"];
      if (deleteKeywords.some(kw => lowerInput.includes(kw))) {
        await handleDeleteTask(userInput);
        setIsProcessing(false);
        setInput("");
        return;
      }

      // Check if this is bulk creation (multiple numbered items or list)
      const isBulk = /\d+[\)\.]\s/.test(userInput) || userInput.split('\n').length > 2;
      
      // Use AI to parse the task(s)
      const response = await apiRequest("POST", "/api/tasks/parse-ai", { 
        input: userInput,
        imageData: imageData || undefined,
        isBulk: isBulk,
        context: {
          today: new Date().toISOString(),
          users: users.map(u => ({ id: u.id, name: u.username })),
          clients: clients.map(c => ({ id: c.id, name: c.name })),
          existingTasks: tasks.slice(0, 20).map(t => ({ id: t.id, title: t.title })),
        }
      });
      
      const parsed = await response.json();
      console.log("🤖 AI parsed:", parsed);

      if (parsed.success && parsed.tasks && parsed.tasks.length > 1) {
        // Bulk creation
        await handleBulkTasks(parsed.tasks);
      } else if (parsed.success) {
        // Single task creation
        const taskInfo = parsed.tasks ? parsed.tasks[0] : parsed;
        const newTaskData: TaskData = {
          title: taskInfo.title || parsed.title || userInput,
          description: taskInfo.description || parsed.description || null,
          priority: taskInfo.priority || parsed.priority || "normal",
          status: "todo",
          dueDate: taskInfo.dueDate || parsed.dueDate || null,
          isRecurring: taskInfo.isRecurring || parsed.isRecurring || false,
          recurringPattern: taskInfo.recurringPattern || parsed.recurringPattern || null,
          recurringInterval: taskInfo.recurringInterval || parsed.recurringInterval || 1,
          recurringEndDate: taskInfo.recurringEndDate || parsed.recurringEndDate || null,
        };

        // Try to match assignee
        const assigneeName = taskInfo.assignee || parsed.assignee;
        if (assigneeName) {
          const matchedUser = users.find(u => 
            u.username?.toLowerCase().includes(assigneeName.toLowerCase()) ||
            assigneeName.toLowerCase().includes(u.username?.toLowerCase())
          );
          if (matchedUser) {
            newTaskData.assignedToId = matchedUser.id;
          }
        }

        // Try to match client
        const clientName = taskInfo.client || parsed.client;
        if (clientName) {
          const matchedClient = clients.find(c => 
            c.name?.toLowerCase().includes(clientName.toLowerCase()) ||
            clientName.toLowerCase().includes(c.name?.toLowerCase())
          );
          if (matchedClient) {
            newTaskData.clientId = matchedClient.id;
          }
        }

        setTaskData(newTaskData);

        // Build a friendly confirmation message
        let confirmMsg = `Perfect! I understood:\n\n`;
        confirmMsg += `📌 **Task:** ${newTaskData.title}\n`;
        if (newTaskData.description) confirmMsg += `📝 **Details:** ${newTaskData.description}\n`;
        confirmMsg += `⚡ **Priority:** ${newTaskData.priority}\n`;
        if (newTaskData.dueDate) {
          confirmMsg += `📅 **Due:** ${new Date(newTaskData.dueDate).toLocaleDateString()}\n`;
        }
        if (newTaskData.isRecurring) {
          confirmMsg += `🔄 **Recurring:** ${newTaskData.recurringPattern} (every ${newTaskData.recurringInterval})\n`;
        }
        if (newTaskData.assignedToId) {
          const user = users.find(u => u.id === newTaskData.assignedToId);
          if (user) confirmMsg += `👤 **Assigned to:** ${user.username}\n`;
        }
        
        confirmMsg += `\n✨ Ready to create this task! Should I proceed? (say "yes" or make changes)`;
        
        addMessage("ai", confirmMsg);
        setCurrentStep("confirm");
      } else {
        // Ask for clarification
        addMessage("ai", "Hmm, I'm not quite sure I got that. Could you tell me more? What's the task you need to create?");
      }
    } catch (error) {
      console.error("Parse error:", error);
      addMessage("ai", "Oops! I had trouble understanding that. Could you rephrase? For example: 'Weekly team meeting every Monday at 10am'");
    }

    setIsProcessing(false);
    setInput("");
  };

  const handleDeleteTask = async (userInput: string) => {
    try {
      // Extract task name from input
      const taskName = userInput.replace(/delete|remove|cancel|drop/gi, '').trim();
      
      // Find matching task
      const matchedTask = tasks.find(t => 
        t.title.toLowerCase().includes(taskName.toLowerCase()) ||
        taskName.toLowerCase().includes(t.title.toLowerCase())
      );

      if (!matchedTask) {
        addMessage("ai", `I couldn't find a task matching "${taskName}". Here are your recent tasks:\n${tasks.slice(0, 5).map(t => `• ${t.title}`).join('\n')}\n\nTry being more specific!`);
        return;
      }

      // Confirm deletion
      addMessage("ai", `Found task: **"${matchedTask.title}"**\n\nAre you sure you want to delete it? (say "yes" to confirm)`);
      setTaskData({ title: matchedTask.id } as any); // Store ID temporarily
      setCurrentStep("confirm");
      setIsBulkMode(false);
      
      // Mark as delete mode
      (window as any).__deleteMode = true;
      (window as any).__taskToDelete = matchedTask.id;
    } catch (error) {
      console.error("Delete error:", error);
      addMessage("ai", "Oops! I had trouble with that. Could you try again?");
    }
  };

  const handleBulkTasks = async (tasksData: any[]) => {
    try {
      setBulkTasks(tasksData);
      setIsBulkMode(true);
      
      let confirmMsg = `Great! I found **${tasksData.length} tasks** to create:\n\n`;
      tasksData.forEach((task, i) => {
        confirmMsg += `${i + 1}. **${task.title}**`;
        if (task.priority && task.priority !== "normal") confirmMsg += ` (${task.priority})`;
        if (task.dueDate) confirmMsg += ` - Due: ${new Date(task.dueDate).toLocaleDateString()}`;
        confirmMsg += `\n`;
      });
      
      confirmMsg += `\n✨ Ready to create all ${tasksData.length} tasks! Say "yes" to proceed.`;
      
      addMessage("ai", confirmMsg);
      setCurrentStep("confirm");
    } catch (error) {
      console.error("Bulk error:", error);
      addMessage("ai", "Oops! I had trouble with that. Could you try again?");
    }
  };

  const createTask = async () => {
    try {
      console.log("🔄 Attempting to create task with data:", taskData);
      
      // Ensure required fields have values
      const taskPayload: any = {
        title: taskData.title || "Untitled Task",
        status: taskData.status || "todo",
        priority: taskData.priority || "normal",
        description: taskData.description || null,
        dueDate: taskData.dueDate ? parseInputDateEST(taskData.dueDate).toISOString() : null,
        assignedToId: taskData.assignedToId || null,
        clientId: taskData.clientId || null,
      };

      // Add recurring fields if task is recurring
      if (taskData.isRecurring) {
        taskPayload.isRecurring = true;
        taskPayload.recurringPattern = taskData.recurringPattern || "daily";
        taskPayload.recurringInterval = taskData.recurringInterval || 1;
        if (taskData.recurringEndDate) {
          taskPayload.recurringEndDate = parseInputDateEST(taskData.recurringEndDate).toISOString();
        }
      }
      
      console.log("📤 Sending task payload:", taskPayload);
      
      const response = await apiRequest("POST", "/api/tasks", taskPayload);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Server error:", errorData);
        throw new Error(errorData.message || "Failed to create task");
      }
      
      const task = await response.json();
      console.log("✅ Task created:", task);
      
      let successMsg = `✅ **Task created successfully!**\n\n"${task.title}" is now in your task list`;
      if (taskData.isRecurring) {
        successMsg += ` and will repeat ${taskData.recurringPattern}!`;
      } else {
        successMsg += "!";
      }
      successMsg += "\n\nNeed to create another task?";
      
      addMessage("ai", successMsg);
      
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
        content: "All done! 🎉 What else can I help you with? Just tell me what's next on your to-do list! 💪",
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
    if ((!input.trim() && !uploadedImage) || isProcessing) return;
    
    // If we're on confirm step and user says yes/ok/sure
    if (currentStep === "confirm") {
      const affirmatives = ["yes", "yep", "yeah", "sure", "ok", "okay", "proceed", "create", "do it", "go ahead", "correct", "right", "perfect"];
      if (affirmatives.some(word => input.toLowerCase().includes(word))) {
        addMessage("user", input);
        
        // Check if delete mode
        if ((window as any).__deleteMode) {
          const taskId = (window as any).__taskToDelete;
          addMessage("ai", "Deleting task... 🗑️");
          setIsProcessing(true);
          deleteTask(taskId).finally(() => {
            setIsProcessing(false);
            (window as any).__deleteMode = false;
            (window as any).__taskToDelete = null;
          });
          setInput("");
          return;
        }
        
        // Check if bulk mode
        if (isBulkMode) {
          addMessage("ai", `Creating ${bulkTasks.length} tasks... ✨`);
          setIsProcessing(true);
          createBulkTasks().finally(() => setIsProcessing(false));
          setInput("");
          return;
        }
        
        // Normal single task creation
        addMessage("ai", "Creating your task now! ✨");
        setIsProcessing(true);
        createTask().finally(() => setIsProcessing(false));
        setInput("");
        return;
      }
    }
    
    parseAIResponse(input, uploadedImage || undefined);
    setUploadedImage(null);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Use the shared handleImageUpload function
    handleImageUpload(file);
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
      
      addMessage("ai", "✅ **Task deleted!** Anything else I can help with?");
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "✅ Task deleted!",
      });

      setTimeout(() => {
        resetChat();
      }, 2000);
    } catch (error: any) {
      console.error("❌ Delete error:", error);
      const errorMessage = error?.message || "Unknown error";
      addMessage("ai", `❌ Oops! Couldn't delete that task: ${errorMessage}`);
      
      toast({
        title: "Failed to delete task",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const createBulkTasks = async () => {
    try {
      let successCount = 0;
      
      for (const taskInfo of bulkTasks) {
        const taskPayload: any = {
          title: taskInfo.title || "Untitled Task",
          status: "todo",
          priority: taskInfo.priority || "normal",
          description: taskInfo.description || null,
          dueDate: taskInfo.dueDate || null,
          assignedToId: taskInfo.assignedToId || null,
          clientId: taskInfo.clientId || null,
        };

        if (taskInfo.isRecurring) {
          taskPayload.isRecurring = true;
          taskPayload.recurringPattern = taskInfo.recurringPattern || "daily";
          taskPayload.recurringInterval = taskInfo.recurringInterval || 1;
          if (taskInfo.recurringEndDate) {
            taskPayload.recurringEndDate = taskInfo.recurringEndDate;
          }
        }

        try {
          await apiRequest("POST", "/api/tasks", taskPayload);
          successCount++;
        } catch (err) {
          console.error("Failed to create task:", taskInfo.title, err);
        }
      }
      
      addMessage("ai", `✅ **Success!** Created ${successCount} of ${bulkTasks.length} tasks!\n\nNeed to create more?`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: `✅ Created ${successCount} tasks!`,
      });

      if (onTaskCreated) {
        onTaskCreated();
      }

      setTimeout(() => {
        resetChat();
        setBulkTasks([]);
        setIsBulkMode(false);
      }, 2000);
    } catch (error: any) {
      console.error("❌ Bulk creation error:", error);
      addMessage("ai", `❌ Oops! Something went wrong with bulk creation.`);
      
      toast({
        title: "Failed to create tasks",
        variant: "destructive",
      });
    }
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
          
          {/* Invisible scroll anchor */}
          <div ref={messagesEndRef} />
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
                📅 Due: {new Date(taskData.dueDate).toLocaleDateString()}
              </Badge>
            )}
            {taskData.isRecurring && (
              <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600">
                🔄 {taskData.recurringPattern}
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardContent className="p-4 border-t flex-shrink-0">
        {uploadedImage && (
          <div className="mb-3 relative">
            <img src={uploadedImage} alt="Uploaded" className="w-full h-32 object-cover rounded-lg border" />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => setUploadedImage(null)}
            >
              <X className="w-3 h-3" />
            </Button>
            <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-xs">
              📷 Image attached
            </Badge>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-shrink-0"
            title="Upload image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleVoiceInput}
            disabled={isProcessing}
            className={`flex-shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''}`}
            title="Voice input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={uploadedImage ? "Tell me about this image..." : isListening ? "Listening..." : "Type your task..."}
            disabled={isProcessing || isListening}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!input.trim() && !uploadedImage) || isProcessing || isListening}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🖼️ Upload image • 🎤 Voice • ✨ Delete • 📋 Bulk create
        </p>
      </CardContent>
    </Card>
  );
}

