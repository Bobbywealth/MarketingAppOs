import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  Send, 
  Inbox, 
  Archive, 
  Trash2, 
  Star, 
  Reply, 
  Forward, 
  MoreVertical,
  Search,
  RefreshCw,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Link as LinkIcon,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Email {
  id: string;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  bodyPreview?: string;
  folder: "inbox" | "sent" | "spam" | "trash" | "archive";
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  receivedAt: string;
  sentAt?: string;
  labels?: string[];
}

export default function EmailsPage() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeForm, setComposeForm] = useState({
    to: "",
    cc: "",
    subject: "",
    body: "",
  });

  // Check URL params for OAuth callback messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast({ 
        title: "Email Connected!", 
        description: "Your Outlook email is now connected. Syncing emails..."
      });
      // Trigger sync
      syncEmailsMutation.mutate();
      // Clean up URL
      window.history.replaceState({}, '', '/emails');
    } else if (params.get('error')) {
      toast({ 
        title: "Connection Failed", 
        description: "Failed to connect your email account. Please try again.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', '/emails');
    }
  }, []);

  // Check if email account is connected
  const { data: emailAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/email-accounts"],
  });

  const isConnected = emailAccounts.length > 0 && emailAccounts[0].isActive;

  // Fetch emails from database
  const { data: emails = [], isLoading } = useQuery<Email[]>({
    queryKey: ["/api/emails", selectedFolder],
    queryFn: async () => {
      const url = selectedFolder ? `/api/emails?folder=${selectedFolder}` : '/api/emails';
      const response = await apiRequest("GET", url);
      return await response.json();
    },
    enabled: isConnected,
  });

  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/emails/sync", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({ 
        title: "✅ Emails synced!", 
        description: `Synced ${data.syncedCount} new emails`
      });
    },
    onError: () => {
      toast({ title: "Failed to sync emails", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: typeof composeForm) => {
      const to = emailData.to.split(',').map(e => e.trim()).filter(Boolean);
      const cc = emailData.cc ? emailData.cc.split(',').map(e => e.trim()).filter(Boolean) : [];
      return apiRequest("POST", "/api/emails/send", {
        to,
        cc,
        subject: emailData.subject,
        body: emailData.body,
        isHtml: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({ title: "✉️ Email sent successfully!" });
      setIsComposeOpen(false);
      setComposeForm({ to: "", cc: "", subject: "", body: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send email", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return apiRequest("PATCH", `/api/emails/${emailId}/read`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const moveToFolderMutation = useMutation({
    mutationFn: async ({ emailId, folder }: { emailId: string; folder: string }) => {
      return apiRequest("PATCH", `/api/emails/${emailId}/move`, { folder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({ title: "Email moved successfully" });
    },
  });

  const [loadingEmailBody, setLoadingEmailBody] = useState(false);

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsReadMutation.mutate(email.id);
    }
    
    // Fetch full body if not already loaded
    if (!email.body || email.body.length === 0) {
      setLoadingEmailBody(true);
      try {
        const response = await apiRequest("GET", `/api/emails/${email.id}/body`);
        const data = await response.json();
        
        // Update the email in the local state
        setSelectedEmail({ ...email, body: data.body });
        
        // Invalidate query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      } catch (error) {
        console.error('Failed to fetch email body:', error);
        toast({
          title: "Failed to load full email",
          description: "Showing preview only",
          variant: "destructive",
        });
      } finally {
        setLoadingEmailBody(false);
      }
    }
  };

  const handleSendEmail = () => {
    if (!composeForm.to || !composeForm.subject) {
      toast({ 
        title: "Missing fields", 
        description: "Please fill in recipient and subject",
        variant: "destructive" 
      });
      return;
    }
    sendEmailMutation.mutate(composeForm);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query) ||
      email.bodyPreview?.toLowerCase().includes(query)
    );
  });

  const folderCounts = {
    inbox: emails.filter(e => e.folder === "inbox").length,
    unread: emails.filter(e => !e.isRead && e.folder === "inbox").length,
    sent: emails.filter(e => e.folder === "sent").length,
    spam: emails.filter(e => e.folder === "spam").length,
    trash: emails.filter(e => e.folder === "trash").length,
    starred: emails.filter(e => e.isStarred).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Management</h1>
          <p className="text-muted-foreground">Manage your company emails and communications</p>
        </div>
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button 
              className="gap-2" 
              onClick={() => window.location.href = '/api/auth/microsoft'}
            >
              <LinkIcon className="w-4 h-4" />
              Connect Outlook Email
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => syncEmailsMutation.mutate()}
                disabled={syncEmailsMutation.isPending}
              >
                {syncEmailsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync Emails
              </Button>
              <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="w-4 h-4" />
                Compose Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Compose New Email</DialogTitle>
                <DialogDescription>Send an email from your company account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">To *</label>
                  <Input
                    placeholder="recipient@example.com"
                    value={composeForm.to}
                    onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CC</label>
                  <Input
                    placeholder="cc@example.com (optional)"
                    value={composeForm.cc}
                    onChange={(e) => setComposeForm({ ...composeForm, cc: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject *</label>
                  <Input
                    placeholder="Email subject"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Write your message..."
                    rows={10}
                    value={composeForm.body}
                    onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  />
                </div>
                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" size="sm">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
                      {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Connection Alert */}
      {!isConnected && !accountsLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your Outlook email account to start managing emails from the CRM. 
            Click the "Connect Outlook Email" button above to get started.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inbox</p>
                <p className="text-2xl font-bold">{folderCounts.inbox}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Inbox className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{folderCounts.unread}</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Mail className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Spam</p>
                <p className="text-2xl font-bold">{folderCounts.spam}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Starred</p>
                <p className="text-2xl font-bold">{folderCounts.starred}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Email Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar - Folders */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button
                variant={selectedFolder === "inbox" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setSelectedFolder("inbox")}
              >
                <Inbox className="w-4 h-4" />
                Inbox
                {folderCounts.unread > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {folderCounts.unread}
                  </Badge>
                )}
              </Button>

              <Button
                variant={selectedFolder === "sent" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setSelectedFolder("sent")}
              >
                <Send className="w-4 h-4" />
                Sent
                <Badge variant="secondary" className="ml-auto">
                  {folderCounts.sent}
                </Badge>
              </Button>

              <Button
                variant={selectedFolder === "starred" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setSelectedFolder("starred")}
              >
                <Star className="w-4 h-4" />
                Starred
                <Badge variant="secondary" className="ml-auto">
                  {folderCounts.starred}
                </Badge>
              </Button>

              <Button
                variant={selectedFolder === "spam" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setSelectedFolder("spam")}
              >
                <AlertCircle className="w-4 h-4" />
                Spam
                {folderCounts.spam > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {folderCounts.spam}
                  </Badge>
                )}
              </Button>

              <Button
                variant={selectedFolder === "trash" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setSelectedFolder("trash")}
              >
                <Trash2 className="w-4 h-4" />
                Trash
                <Badge variant="secondary" className="ml-auto">
                  {folderCounts.trash}
                </Badge>
              </Button>

              <Button
                variant={selectedFolder === "archive" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setSelectedFolder("archive")}
              >
                <Archive className="w-4 h-4" />
                Archive
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email List - Accordion Style */}
        <Card className="lg:col-span-9">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="h-[700px]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading emails...
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No emails in this folder</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your {selectedFolder} folder is empty
                </p>
              </div>
            ) : (
              <div>
                {filteredEmails.map((email) => (
                  <div key={email.id} className="border-b">
                    {/* Compact Email Row */}
                    <div
                      className={`p-3 hover:bg-accent/60 cursor-pointer transition-all border-l-4 ${
                        !email.isRead 
                          ? "bg-blue-50 dark:bg-blue-950/20 border-l-blue-500" 
                          : "border-l-transparent"
                      } ${
                        selectedEmail?.id === email.id 
                          ? "bg-accent/40 border-l-primary" 
                          : ""
                      }`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-8 h-8 flex-shrink-0 ${!email.isRead ? "ring-2 ring-blue-500" : ""}`}>
                          <AvatarFallback className={`text-xs ${!email.isRead ? "bg-blue-500 text-white" : ""}`}>
                            {getInitials(email.fromName || email.from)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-3">
                            <p className={`text-sm truncate ${!email.isRead ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                              {email.fromName || email.from}
                            </p>
                          </div>
                          <div className="col-span-7">
                            <p className={`text-sm truncate ${!email.isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                              {email.subject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {email.bodyPreview}
                            </p>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            {email.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            {email.hasAttachments && <Paperclip className="w-3 h-3 text-muted-foreground" />}
                            {!email.isRead && <Badge className="text-xs bg-blue-500 hover:bg-blue-600">New</Badge>}
                            <span className={`text-xs whitespace-nowrap ${!email.isRead ? "font-semibold" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Email Content */}
                    {selectedEmail?.id === email.id && (
                      <div className="bg-background border-t">
                        <div className="p-6">
                          {/* Email Header */}
                          <div className="mb-4 pb-4 border-b">
                            <h3 className="font-bold text-lg mb-3">{selectedEmail.subject}</h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white font-semibold">
                                    {getInitials(selectedEmail.fromName || selectedEmail.from)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-bold">{selectedEmail.fromName || selectedEmail.from}</p>
                                  <p className="text-xs text-muted-foreground">{selectedEmail.from}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Reply className="w-4 h-4 mr-2" />
                                  Reply
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Forward className="w-4 h-4 mr-2" />
                                  Forward
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Star className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => moveToFolderMutation.mutate({ emailId: selectedEmail.id, folder: "trash" })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Email Body */}
                          {loadingEmailBody ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                                <p className="text-sm text-muted-foreground">Loading full email...</p>
                              </div>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {selectedEmail.body ? (
                                <div 
                                  className="email-content"
                                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                                  style={{
                                    maxWidth: '100%',
                                    overflow: 'auto',
                                  }}
                                />
                              ) : (
                                <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                                  <p className="text-muted-foreground">{selectedEmail.bodyPreview}</p>
                                  <p className="text-xs text-muted-foreground mt-4 italic">Full email content not available. Showing preview only.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
