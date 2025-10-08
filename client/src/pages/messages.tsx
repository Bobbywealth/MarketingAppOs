import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Message, Client, Campaign } from "@shared/schema";

export default function Messages() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedClient],
    enabled: !!selectedClient,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
      toast({ title: "Message sent" });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedClient) return;

    sendMessageMutation.mutate({
      clientId: selectedClient,
      content: messageText,
      isInternal: true,
    });
  };

  return (
    <div className="min-h-full gradient-mesh h-[calc(100vh-4rem)]">
      <div className="h-full flex flex-col p-6 lg:p-8 xl:p-12">
        <div className="mb-6 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Team Messages</h1>
          <p className="text-lg text-muted-foreground">Internal communication for projects and clients</p>
        </div>

        <Card className="flex-1 flex flex-col min-h-0 border-0 shadow-2xl">
          <div className="p-4 border-b">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="Select a client to view messages" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedClient ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a client to view messages</p>
              </div>
            ) : messagesLoading ? (
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
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3" data-testid={`message-${message.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
          </CardContent>

          {selectedClient && (
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
