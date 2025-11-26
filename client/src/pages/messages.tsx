import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Users, MessageSquare, Check, CheckCheck, ArrowLeft, Mic, StopCircle, Play, Pause, SkipBack, Trash2, Image as ImageIcon, X, Filter, ChevronDown, Smile, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Message, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface GroupConversation {
  id: string;
  name: string;
  createdBy: number;
  createdAt: string;
  participants: Array<{ id: number; username: string; role: string }>;
}

interface GroupMessage {
  id: string;
  conversationId: string;
  userId: number;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  durationMs?: number | null;
  createdAt: string;
  authorName: string;
  authorRole: string;
}

interface NormalizedMessage {
  id: string | number;
  userId: number;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  durationMs?: number | null;
  createdAt: string;
  authorName: string;
  authorRole: string;
}

export default function Messages() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [messageMode, setMessageMode] = useState<"direct" | "group">("direct");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<number[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle deep linking from notifications (moved after teamMembers definition)
  // This will be defined later after teamMembers is available
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordStartRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [presenceOnline, setPresenceOnline] = useState<boolean>(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (messageMode === "direct") {
      setSelectedGroupId(null);
    } else {
      setSelectedUserId(null);
      setPresenceOnline(false);
      setLastSeen(null);
    }
  }, [messageMode]);

  // Get all users (will be filtered to admin/staff only)
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get unread message counts per user
  const { data: unreadCounts } = useQuery<Record<number, number>>({
    queryKey: ["/api/messages/unread-counts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/unread-counts", undefined);
      return response.json();
    },
    refetchInterval: 2000, // Refresh every 2 seconds for faster unread badge updates
  });

  // Filter to only show admin, manager, and staff members (exclude clients and current user)
  const teamMembers = allUsers?.filter(u => 
    (u.role === 'admin' || u.role === 'manager' || u.role === 'staff') && 
    u.id !== user?.id
  ) || [];

  // Debug logging
  console.log("📋 All users:", allUsers?.length || 0);
  console.log("👥 Team members:", teamMembers.length, teamMembers.map(u => ({ id: u.id, username: u.username, role: u.role })));

  // Handle deep linking from notifications (now that teamMembers is defined)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    if (userIdParam && allUsers && teamMembers) {
      const userId = parseInt(userIdParam);
      if (!isNaN(userId)) {
        console.log('Deep linking to user ID:', userId);
        console.log('Available users:', allUsers.map(u => ({ id: u.id, username: u.username, role: u.role })));
        
        // Check if the user exists in our available users
        const targetUser = allUsers.find(u => u.id === userId);
        if (targetUser) {
          console.log('Found target user:', targetUser.username, 'role:', targetUser.role);
          setSelectedUserId(userId);
          
          // Show a toast if the user is not normally visible in the team list
          const isInTeamMembers = teamMembers.some(tm => tm.id === userId);
          if (!isInTeamMembers) {
            console.log('User not in normal team list, but opening conversation anyway');
            toast({
              title: `Opening conversation with ${targetUser.firstName || targetUser.username}`,
              description: "This user may not normally appear in your team list",
            });
          }
        } else {
          console.warn('Target user not found in available users');
          toast({
            title: "User not found",
            description: "Could not find the user for this notification",
            variant: "destructive"
          });
        }
        
        // Clear the URL parameter after handling it
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [allUsers, teamMembers]); // Wait for both to load
  console.log("👤 Current user:", user?.username, user?.role);

  // Define mode helpers first
  const isGroupMode = messageMode === "group";
  const isDirectMode = messageMode === "direct";

  // Get group conversations
  const { data: groupConversations = [], isLoading: groupConversationsLoading } = useQuery<GroupConversation[]>({
    queryKey: ["/api/group-conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/group-conversations", undefined);
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Filter by search query and role
  const filteredTeamMembers = teamMembers.filter(member => {
    const matchesSearch = member.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredGroupConversations = groupConversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages/conversation", selectedUserId],
    enabled: messageMode === "direct" && !!selectedUserId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/messages/conversation/${selectedUserId}`, undefined);
      return response.json();
    },
    refetchInterval: selectedUserId && messageMode === "direct" ? 1500 : false, // Auto-refresh every 1.5 seconds when conversation is open for faster messaging
    onSuccess: () => {
      // Invalidate unread counts after viewing a conversation
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-counts"] });
    },
  });

  const { data: groupMessages, isLoading: groupMessagesLoading } = useQuery<GroupMessage[]>({
    queryKey: ["/api/group-conversations", selectedGroupId, "messages"],
    enabled: messageMode === "group" && !!selectedGroupId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/group-conversations/${selectedGroupId}/messages`, undefined);
      return response.json();
    },
    refetchInterval: selectedGroupId && messageMode === "group" ? 1500 : false,
  });

  const selectedUser = isDirectMode ? allUsers?.find(u => u.id === selectedUserId) : undefined;
  const selectedGroup = isGroupMode ? groupConversations.find(conv => conv.id === selectedGroupId) : undefined;

  const normalizedMessages: NormalizedMessage[] = useMemo(() => {
    if (messageMode === "group") {
      return (groupMessages || []).map((msg) => ({
        id: msg.id,
        userId: msg.userId,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        durationMs: msg.durationMs,
        createdAt: msg.createdAt,
        authorName: msg.authorName,
        authorRole: msg.authorRole,
      }));
    }
    return (messages || []).map((msg) => ({
      id: msg.id,
      userId: msg.userId,
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      durationMs: (msg as any).durationMs,
      createdAt: msg.createdAt,
      authorName: msg.userId === user?.id ? (user?.username || "You") : selectedUser?.username || "User",
      authorRole: msg.userId === user?.id ? ((user as any)?.role || "staff") : selectedUser?.role || "staff",
    }));
  }, [messageMode, groupMessages, messages, user, selectedUser]);

  const isLoadingCurrentMessages = isGroupMode ? groupMessagesLoading : messagesLoading;
  const hasActiveConversation = isGroupMode ? Boolean(selectedGroupId) : Boolean(selectedUserId);

  // Presence: heartbeat every 45s when page is open
  useEffect(() => {
    let timer: any;
    const beat = async () => {
      try {
        await apiRequest("POST", "/api/presence/heartbeat", {});
      } catch {}
    };
    beat();
    timer = setInterval(beat, 45000);
    return () => clearInterval(timer);
  }, []);

  // Presence: fetch selected user's status
  useEffect(() => {
    let isActive = true;
    const fetchPresence = async () => {
      if (!selectedUserId) return;
      try {
        const res = await apiRequest("GET", `/api/presence/${selectedUserId}`, undefined);
        const data = await res.json();
        if (!isActive) return;
        setPresenceOnline(Boolean(data.online));
        setLastSeen(data.lastSeen || null);
      } catch {}
    };
    fetchPresence();
    const t = setInterval(fetchPresence, 30000);
    return () => { isActive = false; clearInterval(t); };
  }, [selectedUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const scrollTimer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(scrollTimer);
  }, [messages]);

  // Also scroll when conversation is first opened
  useEffect(() => {
    if (selectedUserId && messages) {
      const scrollTimer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [selectedUserId, messages?.length]);

  // Reset selected user when navigating away
  useEffect(() => {
    return () => {
      setSelectedUserId(null);
    };
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📤 Sending message:", data);
      const response = await apiRequest("POST", "/api/messages", data);
      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Server error:", error);
        throw new Error(error.message || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      // Immediately invalidate and refetch for instant UI update
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-counts"] });
      // Refetch immediately instead of waiting for the interval
      queryClient.refetchQueries({ queryKey: ["/api/messages/conversation", selectedUserId] });
      setMessageText("");
      // Refocus the input so user can continue typing
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 0);
    },
    onError: (error: any) => {
      console.error("❌ Message send error:", error);
      toast({ 
        title: "Failed to send message", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/group-conversations/${data.conversationId}/messages`, data.payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-conversations", selectedGroupId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/group-conversations"] });
      setMessageText("");
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 0);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send group message",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const createGroupConversationMutation = useMutation({
    mutationFn: async (data: { name: string; memberIds: number[] }) => {
      const response = await apiRequest("POST", "/api/group-conversations", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create group");
      }
      return response.json();
    },
    onSuccess: (conversation: GroupConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-conversations"] });
      setIsCreateGroupOpen(false);
      setNewGroupName("");
      setSelectedGroupMembers([]);
      setMessageMode("group");
      setSelectedGroupId(conversation.id);
      toast({
        title: "Group chat created",
        description: `${conversation.name} is ready.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (isGroupMode) {
      if (!selectedGroupId) return;
      sendGroupMessageMutation.mutate({
        conversationId: selectedGroupId,
        payload: {
          content: messageText,
        },
      });
    } else {
      if (!selectedUserId) return;
      sendMessageMutation.mutate({
        recipientId: selectedUserId,
        content: messageText,
        isInternal: true,
      });
    }
  };

  const toggleGroupMember = (memberId: number, checked: boolean) => {
    setSelectedGroupMembers((prev) => {
      if (checked) {
        if (prev.includes(memberId)) return prev;
        return [...prev, memberId];
      }
      return prev.filter((id) => id !== memberId);
    });
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedGroupMembers.length === 0) {
      toast({ title: "Group details missing", description: "Add a name and at least one member.", variant: "destructive" });
      return;
    }
    createGroupConversationMutation.mutate({
      name: newGroupName.trim(),
      memberIds: selectedGroupMembers,
    });
  };

  // Voice message recording
  const handleStartRecording = async () => {
    if (isDirectMode && !selectedUserId) return;
    if (isGroupMode && !selectedGroupId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick a mime type compatible with the current browser (iOS prefers audio/mp4)
      let preferredMime = '';
      if ((window as any).MediaRecorder?.isTypeSupported?.('audio/mp4')) preferredMime = 'audio/mp4';
      else if ((window as any).MediaRecorder?.isTypeSupported?.('audio/mpeg')) preferredMime = 'audio/mpeg';
      else if ((window as any).MediaRecorder?.isTypeSupported?.('audio/webm;codecs=opus')) preferredMime = 'audio/webm;codecs=opus';
      const recorder = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const durationMs = recordStartRef.current ? Date.now() - recordStartRef.current : 0;
          
          // Store the recording for preview
          setRecordedBlob(blob);
          setRecordedDuration(durationMs);
          
          // Create audio URL for preview
          if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(blob);
            audioRef.current.onended = () => setIsPlaying(false);
          }
        } catch (err: any) {
          toast({ title: 'Recording failed', description: err?.message || 'Try again', variant: 'destructive' });
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recordStartRef.current = Date.now();
    } catch (err: any) {
      toast({ title: 'Microphone error', description: err?.message || 'Permission denied', variant: 'destructive' });
    }
  };

  const handleStopRecording = () => {
    const r = mediaRecorderRef.current;
    if (r && r.state !== 'inactive') {
      r.stop();
      r.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    recordStartRef.current = null;
  };

  const handlePlayRecording = () => {
    if (recordedBlob && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleRewindRecording = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleDeleteRecording = () => {
    setRecordedBlob(null);
    setRecordedDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const handleSendVoiceMessage = async () => {
    if (!recordedBlob) return;
    if (isDirectMode && !selectedUserId) return;
    if (isGroupMode && !selectedGroupId) return;
    
    try {
      const formData = new FormData();
      const fileName = `voice_${Date.now()}.${recordedBlob.type.includes('mp4') ? 'mp4' : 'mp3'}`;
      formData.append('file', recordedBlob, fileName);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploaded = await uploadRes.json();
      
      if (isGroupMode) {
        sendGroupMessageMutation.mutate({
          conversationId: selectedGroupId,
          payload: {
            content: '(voice message)',
            mediaUrl: uploaded.url,
            mediaType: recordedBlob.type,
            durationMs: recordedDuration,
          },
        });
      } else {
        sendMessageMutation.mutate({
          recipientId: selectedUserId,
          content: '(voice message)',
          isInternal: true,
          mediaUrl: uploaded.url,
          mediaType: recordedBlob.type,
          durationMs: recordedDuration,
        });
      }
      
      // Clear the recording after sending
      handleDeleteRecording();
    } catch (err: any) {
      toast({
        title: 'Voice message failed',
        description: err?.message || 'Try again',
        variant: 'destructive'
      });
    }
  };

  // Swipe gesture handlers for image modal
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Minimum swipe distance (50px)
    const minSwipeDistance = 50;
    
    // Check if swipe distance is sufficient
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      setSelectedImage(null);
    }
    
    setTouchStart(null);
  };

  const handleTouchCancel = () => {
    setTouchStart(null);
  };

  // Image sending
  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isDirectMode && !selectedUserId) return;
    if (isGroupMode && !selectedGroupId) return;
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      const uploaded = await res.json();
      if (isGroupMode) {
        sendGroupMessageMutation.mutate({
          conversationId: selectedGroupId,
          payload: {
            content: '(image)',
            mediaUrl: uploaded.url,
            mediaType: file.type,
          },
        });
      } else {
        sendMessageMutation.mutate({
          recipientId: selectedUserId,
          content: '(image)',
          isInternal: true,
          mediaUrl: uploaded.url,
          mediaType: file.type,
        });
      }
    } catch (err: any) {
      toast({ title: 'Image send failed', description: err?.message || 'Try again', variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-500',
      manager: 'bg-blue-500',
      staff: 'bg-green-500',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-3 sm:p-4 md:p-6 border-b bg-white">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" data-testid="text-page-title">Team Messages</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Internal communication with admins and staff</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-12 overflow-hidden">
        {/* Team Members Sidebar - Now visible on mobile */}
        <div className={`${selectedUserId ? 'hidden' : 'flex'} md:flex md:col-span-4 border-r flex-col bg-gradient-to-b from-primary/5 via-transparent to-transparent`}>
          <div className="flex-shrink-0 p-3 sm:p-4 border-b space-y-3 bg-white/80 backdrop-blur-sm">
            <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
              <p className="text-xs font-medium text-blue-900">👆 Tap a team member to start messaging</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-8 sm:pl-10 text-xs sm:text-sm shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    <span>
                      {roleFilter === "all" ? "All Roles" : 
                       roleFilter === "admin" ? "Admins" :
                       roleFilter === "manager" ? "Managers" : "Staff"}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 overflow-hidden">
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
                      onClick={() => {
                        setRoleFilter("all");
                        setShowFilterDropdown(false);
                      }}
                    >
                      All Roles
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => {
                        setRoleFilter("admin");
                        setShowFilterDropdown(false);
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Admins
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => {
                        setRoleFilter("manager");
                        setShowFilterDropdown(false);
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Managers
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => {
                        setRoleFilter("staff");
                        setShowFilterDropdown(false);
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Staff
                    </button>
                  </div>
                )}
              </div>
              
              <Badge variant="secondary" className="text-xs">
                {filteredTeamMembers.length}
              </Badge>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredTeamMembers.length === 0 ? (
                <div className="text-center py-8 md:py-12 px-4">
                  <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm md:text-base font-medium text-muted-foreground mb-2">
                    {searchQuery ? "No team members found" : "No team members available"}
                  </p>
                  {!searchQuery && (
                    <div className="mt-4 text-left bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-xs text-blue-900 dark:text-blue-100 mb-2 font-medium">💡 Why am I not seeing anyone?</p>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5 list-disc list-inside">
                        <li>Team messages are only for admins, managers, and staff</li>
                        <li>You may be the only team member registered</li>
                        <li>Ask your admin to add more team members</li>
                      </ul>
                    </div>
                  )}
                  {searchQuery && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTeamMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedUserId(member.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                        selectedUserId === member.id 
                          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' 
                          : 'hover:bg-white hover:shadow-lg border-2 border-transparent'
                      }`}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="flex items-center gap-3 relative z-10">
                        {/* Avatar with status dot */}
                        <div className="relative">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-white shadow-sm">
                            <AvatarFallback className={`${getRoleBadgeColor(member.role)} text-white text-sm font-semibold`}>
                              {getInitials(member.username)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Status dot */}
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(true)}`}></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold truncate text-sm">{member.username}</p>
                            {unreadCounts?.[member.id] && (
                              <Badge 
                                variant="destructive" 
                                className="text-xs h-5 min-w-[20px] flex items-center justify-center animate-pulse shadow-lg"
                              >
                                {unreadCounts[member.id]}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] px-1.5 py-0 ${getRoleBadgeColor(member.role)} text-white`}
                            >
                              {member.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(true)}`}></div>
                              Online
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Messages Area - Now with back button on mobile */}
        <div className={`${!selectedUserId ? 'hidden' : 'flex'} md:flex md:col-span-8 flex-col overflow-hidden`}>
          {!selectedUserId ? (
            <div className="flex-1 hidden md:flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium mb-1">Select a team member</p>
                <p className="text-sm text-muted-foreground">
                  Choose someone from the list to start messaging
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header - Enhanced */}
              <div className="flex-shrink-0 p-3 sm:p-4 border-b bg-gradient-to-r from-white to-primary/5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden hover:bg-accent h-8 w-8"
                      onClick={() => setSelectedUserId(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    
                    {/* Avatar with status */}
                    <div className="relative">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-white shadow-md">
                        <AvatarFallback className={`${selectedUser && getRoleBadgeColor(selectedUser.role)} text-white font-semibold`}>
                          {selectedUser && getInitials(selectedUser.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${presenceOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base">{selectedUser?.username}</h3>
                        {selectedUser && (
                          <Badge 
                            variant="secondary" 
                            className={`text-[10px] ${getRoleBadgeColor(selectedUser.role)} text-white`}
                          >
                            {selectedUser.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${presenceOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {presenceOnline ? '🟢 Online' : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full p-2 sm:p-3 md:p-4 bg-gradient-to-b from-gray-50/50 to-transparent">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                          <div className="h-16 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.userId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 sm:gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                          data-testid={`message-${message.id}`}
                        >
                          <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {isOwnMessage 
                                ? getInitials(user?.username || 'U')
                                : getInitials(selectedUser?.username || 'U')
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[75%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className="flex items-center gap-1 sm:gap-2 mb-1">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div
                              className={`rounded-2xl p-3 shadow-sm transition-all hover:shadow-md ${
                                isOwnMessage
                                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              {message.mediaUrl ? (
                                <div className="space-y-1">
                                  {message.mediaType?.startsWith('image') ? (
                                    <div 
                                      className="cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => setSelectedImage(message.mediaUrl)}
                                    >
                                      <img src={message.mediaUrl} alt="image message" className="max-w-[240px] max-h-[240px] rounded-md shadow" />
                                    </div>
                                  ) : (
                                    <>
                                      <audio controls preload="metadata" src={message.mediaUrl} className="w-full">
                                        Your browser does not support the audio element.
                                      </audio>
                                      {message.durationMs && (
                                        <div className="text-[10px] opacity-80">
                                          {Math.round((message.durationMs as any) / 1000)}s
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            {isOwnMessage && (
                              <div className="flex items-center gap-1 mt-1">
                                {message.readAt ? (
                                  <>
                                    <CheckCheck className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Read</span>
                                  </>
                                ) : message.deliveredAt ? (
                                  <>
                                    <Check className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Delivered</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Sent</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start the conversation with {selectedUser?.username}!
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>💬</span>
                        <span>Send a message to get started</span>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="flex-shrink-0 p-2 sm:p-3 md:p-4 border-t bg-white space-y-3">
                {/* Voice Message Preview */}
                {recordedBlob && (
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={handlePlayRecording}
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 rounded-full p-0"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full relative">
                          <div className="h-2 bg-blue-500 rounded-full w-0" style={{ width: isPlaying ? '100%' : '0%' }}></div>
                          <div className="absolute top-0 left-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full -mt-0.5"></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(recordedDuration / 1000)}s
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        onClick={handleRewindRecording}
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={handleDeleteRecording}
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={handleSendVoiceMessage}
                        disabled={sendMessageMutation.isPending}
                        size="sm"
                        className="gap-1"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </Button>
                    </div>
                    <audio ref={audioRef} className="hidden" />
                  </div>
                )}

                {/* Regular Message Input */}
                {!recordedBlob && (
                  <form onSubmit={handleSendMessage} className="flex gap-1 sm:gap-2">
                    <Input
                      ref={messageInputRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Message ${selectedUser?.username}...`}
                      disabled={sendMessageMutation.isPending}
                      data-testid="input-message"
                      className="flex-1 text-xs sm:text-sm"
                      autoFocus
                    />
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />
                    <Button type="button" onClick={handlePickImage} variant="secondary" className="gap-1 sm:gap-2 shrink-0 h-8 sm:h-10" size="sm">
                      <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Image</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      variant={isRecording ? 'destructive' : 'secondary'}
                      className="gap-1 sm:gap-2 shrink-0 h-8 sm:h-10"
                      size="sm"
                    >
                      {isRecording ? <StopCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4" />}
                      <span className="hidden sm:inline text-xs sm:text-sm">{isRecording ? 'Stop' : 'Voice'}</span>
                    </Button>
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                      className="gap-1 sm:gap-2 shrink-0 h-8 sm:h-10"
                      size="sm"
                    >
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Send</span>
                    </Button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="relative max-w-full max-h-full">
            <Button
              onClick={() => setSelectedImage(null)}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
            >
              <X className="w-4 h-4" />
            </Button>
            <img 
              src={selectedImage} 
              alt="Full size image" 
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
