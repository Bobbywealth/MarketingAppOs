import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Users, MessageSquare, Check, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Message, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get all users (will be filtered to admin/staff only)
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter to only show admin, manager, and staff members (exclude clients and current user)
  const teamMembers = allUsers?.filter(u => 
    (u.role === 'admin' || u.role === 'manager' || u.role === 'staff') && 
    u.id !== user?.id
  ) || [];

  // Filter by search query
  const filteredTeamMembers = teamMembers.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages/conversation", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/messages/conversation/${selectedUserId}`, undefined);
      return response.json();
    },
    refetchInterval: selectedUserId ? 3000 : false, // Auto-refresh every 3 seconds when conversation is open
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedUserId] });
      setMessageText("");
      toast({ title: "✅ Message sent" });
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUserId) return;

    sendMessageMutation.mutate({
      recipientId: selectedUserId,
      content: messageText,
      isInternal: true,
    });
  };

  const selectedUser = teamMembers.find(u => u.id === selectedUserId);

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-500' : 'bg-blue-500';
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 md:p-6 border-b">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold" data-testid="text-page-title">Team Messages</h1>
          <p className="text-sm md:text-base text-muted-foreground">Internal communication with admins and staff</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Team Members Sidebar */}
        <div className="hidden md:flex md:col-span-4 border-r flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredTeamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No team members found" : "No team members available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTeamMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedUserId(member.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                        selectedUserId === member.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{member.username}</p>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getRoleBadgeColor(member.role)} text-white`}
                            >
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Active • Click to message
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="col-span-1 md:col-span-8 flex flex-col">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center">
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
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser && getInitials(selectedUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedUser?.username}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
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
                          className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                          data-testid={`message-${message.id}`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {isOwnMessage 
                                ? getInitials(user?.username || 'U')
                                : getInitials(selectedUser?.username || 'U')
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg p-3 ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {isOwnMessage && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCheck className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Sent</span>
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
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground">Start the conversation!</p>
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message ${selectedUser?.username}...`}
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
