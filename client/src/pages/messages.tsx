import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// NOTE: We intentionally avoid Radix ScrollArea here. For long chat threads, a plain overflow container
// is more reliable for preventing the overall page/document height from growing.
import { Send, Search, Users, MessageSquare, Check, CheckCheck, ArrowLeft, Mic, StopCircle, Play, Pause, SkipBack, Trash2, Image as ImageIcon, X, Filter, ChevronDown, Smile, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { resolveApiUrl } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
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
  readAt?: string | null;
  deliveredAt?: string | null;
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
  const conversationScrollRef = useRef<HTMLDivElement>(null);
  const scrollLogCountRef = useRef(0);
  const windowScrollLogCountRef = useRef(0);
  const debugEnabled =
    Boolean((import.meta as any)?.env?.DEV) ||
    (() => {
      try {
        return new URLSearchParams(window.location.search).has("__debug");
      } catch {
        return false;
      }
    })();
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
  });

  // Invalidate unread counts after viewing a conversation (TanStack v5 removed onSuccess for useQuery).
  useEffect(() => {
    if (messageMode !== "direct") return;
    if (!selectedUserId) return;
    // Only invalidate when we actually have messages loaded (avoids extra churn)
    if (!messages) return;
    queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-counts"] });
  }, [messageMode, selectedUserId, messages?.length]);

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
      createdAt: msg.createdAt ? new Date(msg.createdAt as any).toISOString() : "",
      authorName: msg.userId === user?.id ? (user?.username || "You") : selectedUser?.username || "User",
      authorRole: msg.userId === user?.id ? ((user as any)?.role || "staff") : selectedUser?.role || "staff",
      readAt: msg.readAt ? new Date(msg.readAt as any).toISOString() : null,
      deliveredAt: msg.deliveredAt ? new Date(msg.deliveredAt as any).toISOString() : null,
    }));
  }, [messageMode, groupMessages, messages, user, selectedUser]);

  const isLoadingCurrentMessages = isGroupMode ? groupMessagesLoading : messagesLoading;
  const hasActiveConversation = isGroupMode ? Boolean(selectedGroupId) : Boolean(selectedUserId);

  // #region agent log (hypothesis C/D: message list duplicates/appends unexpectedly and inflates heights)
  useEffect(() => {
    try {
      if (!debugEnabled) return;
      const el = conversationScrollRef.current;
      const docEl = document.documentElement;
      fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'C',location:'client/src/pages/messages.tsx:messages-effect',message:'messages changed snapshot',data:{messageMode,selectedUserId,selectedGroupId,messageCount:normalizedMessages?.length ?? null,isLoadingCurrentMessages,convClientH:el?.clientHeight,convScrollH:el?.scrollHeight,convScrollTop:el?.scrollTop,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight},timestamp:Date.now()})}).catch(()=>{});
      fetch(resolveApiUrl('/api/__debug/log'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'C',location:'client/src/pages/messages.tsx:messages-effect',message:'messages changed snapshot',data:{messageMode,selectedUserId,selectedGroupId,messageCount:normalizedMessages?.length ?? null,isLoadingCurrentMessages,convClientH:el?.clientHeight,convScrollH:el?.scrollHeight,convScrollTop:el?.scrollTop,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight},timestamp:Date.now()})}).catch(()=>{});
    } catch {}
  }, [messageMode, selectedUserId, selectedGroupId, normalizedMessages?.length, isLoadingCurrentMessages, debugEnabled]);
  // #endregion agent log

  // #region agent log (hypothesis A: the window/document is scrolling instead of the conversation pane)
  useEffect(() => {
    const onWinScroll = () => {
      try {
        if (!debugEnabled) return;
        if (windowScrollLogCountRef.current >= 12) return;
        windowScrollLogCountRef.current += 1;
        const docEl = document.documentElement;
        fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'A',location:'client/src/pages/messages.tsx:window-scroll',message:'window scrolled',data:{windowScrollY:window.scrollY,windowInnerH:window.innerHeight,docClientH:docEl.clientHeight,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight},timestamp:Date.now()})}).catch(()=>{});
        fetch(resolveApiUrl('/api/__debug/log'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'A',location:'client/src/pages/messages.tsx:window-scroll',message:'window scrolled',data:{windowScrollY:window.scrollY,windowInnerH:window.innerHeight,docClientH:docEl.clientHeight,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight},timestamp:Date.now()})}).catch(()=>{});
      } catch {}
    };
    window.addEventListener("scroll", onWinScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWinScroll as any);
  }, [debugEnabled]);
  // #endregion agent log

  // #region agent log (hypothesis B: conversation pane height constraint not applied; pane grows instead of scrolling)
  const onConversationScroll = () => {
    try {
      if (!debugEnabled) return;
      const el = conversationScrollRef.current;
      if (!el) return;
      if (scrollLogCountRef.current >= 20) return;
      scrollLogCountRef.current += 1;
      const docEl = document.documentElement;
      fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'B',location:'client/src/pages/messages.tsx:conversation-scroll',message:'conversation scrolled',data:{convClientH:el.clientHeight,convScrollH:el.scrollHeight,convScrollTop:el.scrollTop,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight,messageCount:normalizedMessages?.length ?? null},timestamp:Date.now()})}).catch(()=>{});
      fetch(resolveApiUrl('/api/__debug/log'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'B',location:'client/src/pages/messages.tsx:conversation-scroll',message:'conversation scrolled',data:{convClientH:el.clientHeight,convScrollH:el.scrollHeight,convScrollTop:el.scrollTop,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight,messageCount:normalizedMessages?.length ?? null},timestamp:Date.now()})}).catch(()=>{});
    } catch {}
  };
  // #endregion agent log

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
      
      const uploadRes = await apiRequest("POST", "/api/upload", formData);
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
      const res = await apiRequest("POST", "/api/upload", form);
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

  const getRoleBadgeStyles = (role: string) => {
    const styles = {
      admin: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        dot: 'bg-purple-500'
      },
      manager: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        dot: 'bg-blue-500'
      },
      staff: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
        dot: 'bg-green-500'
      },
    };
    return styles[role as keyof typeof styles] || { bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' };
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700';
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-zinc-950">
      {/* Premium Page Header */}
      <div className="flex-shrink-0 px-6 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100" data-testid="text-page-title">
                Messages
              </h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium ml-13">
              Collaborate with your team in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-4">
              {teamMembers.slice(0, 3).map((m, i) => (
                <Avatar key={m.id} className="w-8 h-8 border-2 border-white dark:border-zinc-900 ring-2 ring-zinc-50 dark:ring-zinc-800">
                  <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800">
                    {getInitials(m.username)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {teamMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  +{teamMembers.length - 3}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-zinc-200 dark:border-zinc-800 font-semibold h-9">
              <Paperclip className="w-4 h-4 mr-2 text-zinc-400" />
              Files
            </Button>
            <Button size="sm" className="rounded-xl font-bold h-9 shadow-lg shadow-primary/20">
              <Users className="w-4 h-4 mr-2" />
              Directory
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-12 overflow-hidden">
        {/* Team List Panel */}
        <div className={`${selectedUserId ? 'hidden' : 'flex'} md:flex md:col-span-4 min-h-0 border-r flex-col bg-white dark:bg-zinc-950`}>
          <div className="flex-shrink-0 p-4 border-b space-y-4 bg-white dark:bg-zinc-950">
            {/* Smart Search Bar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md group-focus-within:bg-primary/10 transition-all duration-300"></div>
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm group-focus-within:border-primary/30 group-focus-within:ring-4 group-focus-within:ring-primary/5 transition-all duration-300">
                <Search className="ml-3 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search name, role, or status..."
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="pr-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-lg transition-all ${showFilterDropdown ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-zinc-600'}`}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {showFilterDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-1">
                    {[
                      { id: 'all', label: 'All Roles', color: 'bg-zinc-400' },
                      { id: 'admin', label: 'Admins', color: 'bg-purple-500' },
                      { id: 'manager', label: 'Managers', color: 'bg-blue-500' },
                      { id: 'staff', label: 'Staff', color: 'bg-green-500' }
                    ].map((role) => (
                      <button
                        key={role.id}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all flex items-center gap-3 ${
                          roleFilter === role.id 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                        onClick={() => {
                          setRoleFilter(role.id);
                          setShowFilterDropdown(false);
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${role.color} ring-4 ${role.id === roleFilter ? 'ring-primary/20' : 'ring-transparent'}`}></div>
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-3">
              {filteredTeamMembers.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-zinc-800 shadow-inner">
                    <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {searchQuery ? "No results found" : "Looking a bit quiet here"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px] mx-auto">
                    {searchQuery ? "Try searching for a different name or role" : "Invite your team to start collaborating"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTeamMembers.map((member) => {
                    const isSelected = selectedUserId === member.id;
                    const hasUnread = unreadCounts?.[member.id];
                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedUserId(member.id)}
                        className={`group p-3 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center gap-4 ${
                          isSelected 
                            ? 'bg-primary/5 border-2 border-primary/20 shadow-sm' 
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 border-2 border-transparent'
                        }`}
                      >
                        {/* Hover Accent Bar */}
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0'}`}></div>
                        
                        {/* Avatar with Status */}
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-12 h-12 border-2 border-white dark:border-zinc-800 shadow-md transition-transform duration-300 group-hover:scale-105">
                            <AvatarFallback className={`bg-gradient-to-br from-primary/80 to-purple-600/80 text-white text-base font-bold`}>
                              {getInitials(member.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm ${getStatusColor(true)}`}>
                            <div className={`w-full h-full rounded-full ${getStatusColor(true)} animate-ping opacity-40`}></div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className={`font-bold truncate transition-colors ${isSelected ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              {member.username}
                            </p>
                            {hasUnread && (
                              <Badge className="bg-primary hover:bg-primary text-white text-[10px] h-5 min-w-[20px] rounded-full px-1.5 shadow-lg shadow-primary/20 animate-bounce">
                                {hasUnread}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] px-2 py-0 h-4 rounded-md font-bold uppercase tracking-wider ${getRoleBadgeStyles(member.role).bg} ${getRoleBadgeStyles(member.role).text} border-0`}
                            >
                              {member.role}
                            </Badge>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                              Active 2 min ago
                            </span>
                          </div>
                        </div>

                        {/* Hover Action Icon */}
                        <div className={`flex-shrink-0 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area - Now with back button on mobile */}
        <div className={`${!selectedUserId ? 'hidden' : 'flex'} md:flex md:col-span-8 min-h-0 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-900`}>
          {!selectedUserId ? (
            <div className="flex-1 hidden md:flex items-center justify-center p-8">
              <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                  <div className="absolute inset-4 bg-primary/20 rounded-full animate-ping duration-1000"></div>
                  <div className="relative w-full h-full bg-white dark:bg-zinc-800 rounded-full shadow-xl flex items-center justify-center border-4 border-zinc-50 dark:border-zinc-900">
                    <MessageSquare className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Start a conversation</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Select a team member from the sidebar to collaborate in real-time.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-xl h-12 border-2 border-zinc-200 dark:border-zinc-800 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                    <Users className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-primary transition-colors" />
                    Create Group
                  </Button>
                  <Button variant="outline" className="rounded-xl h-12 border-2 border-zinc-200 dark:border-zinc-800 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                    <Smile className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-primary transition-colors" />
                    Message Admin
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Modern Chat Header */}
              <div className="flex-shrink-0 p-4 border-b bg-white dark:bg-zinc-950 shadow-sm z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden hover:bg-zinc-100 dark:hover:bg-zinc-900 h-10 w-10 rounded-xl"
                      onClick={() => setSelectedUserId(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    
                    {/* Avatar with Status */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Avatar className="w-12 h-12 border-2 border-white dark:border-zinc-800 shadow-md relative z-10">
                        <AvatarFallback className={`${selectedUser && getRoleBadgeStyles(selectedUser.role).dot} text-white font-bold text-base`}>
                          {selectedUser && getInitials(selectedUser.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-800 z-20 shadow-sm ${presenceOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`}></div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{selectedUser?.username}</h3>
                        {selectedUser && (
                          <Badge 
                            variant="secondary" 
                            className={`text-[10px] px-2 py-0 h-4 rounded-md font-bold uppercase tracking-wider ${getRoleBadgeStyles(selectedUser.role).bg} ${getRoleBadgeStyles(selectedUser.role).text} border-0`}
                          >
                            {selectedUser.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${presenceOnline ? 'text-green-600 dark:text-green-500' : 'text-zinc-400'}`}>
                          {presenceOnline ? 'Online now' : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                      <Search className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                      <Users className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                      <ChevronDown className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 bg-zinc-50 dark:bg-zinc-900/50 relative">
                <div ref={conversationScrollRef} onScroll={onConversationScroll} className="h-full overflow-y-auto overscroll-contain">
                  <div className="p-4 sm:p-6 space-y-6">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
                            <div className={`space-y-2 ${i % 2 === 0 ? 'items-start' : 'items-end'} flex flex-col w-full max-w-[60%]`}>
                              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 animate-pulse"></div>
                              <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : normalizedMessages && normalizedMessages.length > 0 ? (
                      <div className="space-y-6">
                        {normalizedMessages.map((message, idx) => {
                          const isOwnMessage = message.userId === user?.id;
                          const showAvatar = idx === 0 || normalizedMessages[idx-1].userId !== message.userId;
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex gap-3 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              {/* Avatar with conditional visibility for message grouping */}
                              <div className="w-10 flex-shrink-0">
                                {showAvatar && (
                                  <Avatar className="w-10 h-10 border-2 border-white dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105">
                                    <AvatarFallback className={`${isOwnMessage ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'} text-xs font-bold`}>
                                      {isOwnMessage ? getInitials(user?.username || 'U') : getInitials(message.authorName || 'U')}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>

                              <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                {showAvatar && (
                                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 px-1">
                                    {isOwnMessage ? 'You' : message.authorName} • {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                  </span>
                                )}
                                
                                <div className="relative group/bubble">
                                  <div
                                    className={`rounded-2xl px-4 py-3 shadow-sm transition-all relative ${
                                      isOwnMessage
                                        ? 'bg-primary text-white rounded-tr-none shadow-primary/10'
                                        : message.authorRole === 'admin' 
                                          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-zinc-900 dark:text-zinc-100 rounded-tl-none'
                                          : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-tl-none'
                                    }`}
                                  >
                                    {message.mediaUrl ? (
                                      <div className="space-y-2">
                                        {message.mediaType?.startsWith('image') ? (
                                          <div 
                                            className="cursor-pointer overflow-hidden rounded-lg shadow-md hover:ring-4 hover:ring-primary/20 transition-all"
                                            onClick={() => setSelectedImage(message.mediaUrl || null)}
                                          >
                                            <img src={message.mediaUrl} alt="message attachment" className="max-w-full h-auto max-h-[300px] object-cover" />
                                          </div>
                                        ) : (
                                          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                            <audio controls preload="metadata" src={message.mediaUrl} className="w-full h-8" />
                                            {message.durationMs && (
                                              <div className="text-[10px] text-zinc-400 mt-2 font-medium">
                                                Voice Message • {Math.round((message.durationMs as any) / 1000)}s
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    )}

                                    {/* Hover Timestamp */}
                                    <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-bold text-zinc-400 px-2 ${isOwnMessage ? 'right-full' : 'left-full'}`}>
                                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>

                                {isOwnMessage && (
                                  <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                      {message.readAt ? 'Seen' : 'Delivered'}
                                    </span>
                                    {message.readAt ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-primary" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-zinc-300" />
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
                      <div className="flex flex-col items-center justify-center h-full text-center p-12 space-y-6">
                        <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-3xl shadow-xl flex items-center justify-center rotate-3 border-2 border-zinc-50 dark:border-zinc-900">
                          <Smile className="w-12 h-12 text-primary animate-bounce" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Say hello to {selectedUser?.username}!</h3>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                            Send a message to start collaborating and get the project moving forward.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {['👋 Hey!', '🙌 Ready to start?', '🔥 Let\'s go!'].map((msg) => (
                            <Button 
                              key={msg}
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setMessageText(msg);
                                messageInputRef.current?.focus();
                              }}
                              className="rounded-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:text-primary transition-all text-xs font-semibold"
                            >
                              {msg}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Message Input Area */}
              <div className="flex-shrink-0 p-4 border-t bg-white dark:bg-zinc-950 z-10">
                <div className="max-w-4xl mx-auto">
                  {/* Voice Message Preview */}
                  {recordedBlob && (
                    <div className="mb-3 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border-2 border-primary/20 shadow-lg flex items-center gap-4">
                        <Button
                          type="button"
                          onClick={handlePlayRecording}
                          className={`w-12 h-12 rounded-full p-0 shadow-lg shadow-primary/20 transition-transform active:scale-95 ${isPlaying ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-primary text-white'}`}
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                        </Button>
                        
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300 ease-linear" style={{ width: isPlaying ? '100%' : '0%' }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            <span>{isPlaying ? 'Playing...' : 'Recording Ready'}</span>
                            <span>{Math.round(recordedDuration / 1000)}s</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={handleDeleteRecording}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSendVoiceMessage}
                            disabled={sendMessageMutation.isPending}
                            className="rounded-xl h-10 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                          >
                            <Send className="w-4 h-4" />
                            Send
                          </Button>
                        </div>
                      </div>
                      <audio ref={audioRef} className="hidden" />
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-300 shadow-sm">
                      <div className="flex items-center gap-1 pb-1 pl-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                          <Smile className="w-5 h-5" />
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePickImage}
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>
                      </div>

                      <Input
                        ref={messageInputRef}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent min-h-[44px] text-sm py-3"
                        disabled={sendMessageMutation.isPending}
                        autoFocus
                      />
                      
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />
                      
                      <div className="flex items-center gap-1 pb-1 pr-1">
                        {!messageText.trim() ? (
                          <Button
                            type="button"
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`h-9 w-9 rounded-xl transition-all duration-300 ${
                              isRecording 
                                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            disabled={!messageText.trim() || sendMessageMutation.isPending}
                            className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span className="text-xs font-bold uppercase tracking-wider">Send</span>
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between px-2">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        Press Enter to send
                      </p>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                      </div>
                    </div>
                  </form>
                </div>
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
