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
  Loader2,
  Sparkles,
  TrendingUp,
  Tag,
  ListChecks,
  Lightbulb
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
      // Trigger manual sync with toast
      setIsManualSync(true);
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

  const [isManualSync, setIsManualSync] = useState(false);

  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/emails/sync", {});
      const data = await response.json();
      
      // If response is not ok, throw error with message
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Sync failed');
      }
      
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-accounts"] });
      console.log("✅ Email sync successful:", data);
      
      // Only show toast for manual syncs
      if (isManualSync && data.syncedCount > 0) {
        toast({ 
          title: "✅ Emails synced!", 
          description: `Synced ${data.syncedCount} new emails`
        });
      }
      setIsManualSync(false);
    },
    onError: (error: any) => {
      console.error("❌ Email sync failed:", error);
      
      // Only show error toasts for manual syncs, not background syncs
      if (isManualSync) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('invalid_grant') || errorMessage.includes('AADSTS')) {
          toast({ 
            title: "Email connection expired", 
            description: "Your Outlook connection needs to be refreshed. Please reconnect your account.",
            variant: "destructive",
            duration: 10000,
          });
        } else {
          toast({ 
            title: "Failed to sync emails", 
            description: error?.message || "Please check your connection and try again",
            variant: "destructive" 
          });
        }
      }
      setIsManualSync(false);
    },
  });

  // Validate and refresh token when page loads (prevents timeout)
  useEffect(() => {
    if (!isConnected) return;

    const validateToken = async () => {
      try {
        console.log("🔐 Validating email token...");
        const response = await apiRequest("POST", "/api/emails/validate-token", {});
        const result = await response.json();
        
        if (result.refreshed) {
          console.log("✓ Token was refreshed");
          toast({
            title: "Connection Refreshed",
            description: "Your email is now connected"
          });
        } else if (result.valid) {
          console.log("✓ Token is valid");
        }
      } catch (error) {
        console.error("❌ Token validation failed:", error);
        toast({
          title: "Connection Issue",
          description: "Please reconnect your email account",
          variant: "destructive"
        });
      }
    };

    // Validate token immediately on page load
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Auto-sync emails every 5 minutes (silent background sync)
  useEffect(() => {
    if (!isConnected) return;

    // Initial sync when page loads (after 2 seconds)
    const initialTimer = setTimeout(() => {
      console.log("🔄 Initial email sync...");
      syncEmailsMutation.mutate(); // isManualSync is false, so no toast
    }, 2000);

    // Set up interval for auto-sync every 5 minutes
    const syncInterval = setInterval(() => {
      console.log("🔄 Background email sync...");
      syncEmailsMutation.mutate(); // isManualSync is false, so no toast
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => {
      console.log("⏹️ Stopping email auto-sync");
      clearTimeout(initialTimer);
      clearInterval(syncInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

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

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return apiRequest("DELETE", `/api/emails/${emailId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      setSelectedEmail(null);
      toast({ title: "🗑️ Email deleted permanently" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete email", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleReconnect = async () => {
    if (emailAccounts.length > 0) {
      try {
        // Delete old email account
        await apiRequest("DELETE", `/api/email-accounts/${emailAccounts[0].id}`, {});
        console.log("Old email account deleted");
      } catch (error) {
        console.error("Failed to delete old account:", error);
      }
    }
    // Redirect to Microsoft OAuth
    window.location.href = '/api/auth/microsoft';
  };

  const [loadingEmailBody, setLoadingEmailBody] = useState(false);
  const [analyzingEmail, setAnalyzingEmail] = useState(false);
  const [emailAnalysis, setEmailAnalysis] = useState<any>(null);

  const handleEmailClick = async (email: Email) => {
    // Toggle: if clicking the same email, collapse it
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null);
      setEmailAnalysis(null);
      return;
    }

    setSelectedEmail(email);
    setEmailAnalysis(null); // Reset analysis when switching emails
    
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

  const handleAnalyzeEmail = async (emailId: string) => {
    setAnalyzingEmail(true);
    try {
      const response = await apiRequest("POST", `/api/emails/${emailId}/analyze`, {});
      const data = await response.json();
      
      if (data.success) {
        setEmailAnalysis(data.analysis);
        toast({
          title: "✨ Email analyzed!",
          description: "AI analysis complete",
        });
      }
    } catch (error: any) {
      console.error('Failed to analyze email:', error);
      toast({
        title: "Failed to analyze email",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setAnalyzingEmail(false);
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

  const handleReply = (email: Email) => {
    setComposeForm({
      to: email.from,
      cc: "",
      subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
      body: `\n\n---\nOn ${new Date(email.receivedAt).toLocaleString()}, ${email.fromName || email.from} wrote:\n${email.bodyPreview}`,
    });
    setIsComposeOpen(true); // Use the existing compose dialog
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
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Email Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your company emails</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
                onClick={handleReconnect}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsManualSync(true);
                  syncEmailsMutation.mutate();
                }}
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
                <DialogTitle>
                  {composeForm.subject.startsWith('Re: ') ? 'Reply to Email' : 'Compose New Email'}
                </DialogTitle>
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
                      className={`py-2 px-3 hover:bg-accent/50 cursor-pointer transition-all border-l-2 ${
                        !email.isRead 
                          ? "bg-blue-50/50 dark:bg-blue-950/10 border-l-blue-500" 
                          : "border-l-transparent"
                      } ${
                        selectedEmail?.id === email.id 
                          ? "bg-accent/30 border-l-primary" 
                          : ""
                      }`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className={`w-6 h-6 flex-shrink-0 ${!email.isRead ? "ring-1 ring-blue-500" : ""}`}>
                          <AvatarFallback className={`text-[10px] ${!email.isRead ? "bg-blue-500 text-white" : ""}`}>
                            {getInitials(email.fromName || email.from)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-2">
                            <p className={`text-xs truncate ${!email.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                              {email.fromName || email.from}
                            </p>
                          </div>
                          <div className="col-span-8">
                            <div className="flex items-baseline gap-2">
                              <p className={`text-xs truncate flex-1 ${!email.isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                                {email.subject}
                              </p>
                              <span className="text-[10px] text-muted-foreground/60 hidden md:inline">—</span>
                              <p className="text-[11px] text-muted-foreground/70 truncate flex-1 hidden md:block">
                                {email.bodyPreview}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1.5">
                            {email.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                            {email.hasAttachments && <Paperclip className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />}
                            <span className={`text-[10px] whitespace-nowrap ${!email.isRead ? "font-semibold" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Email Content */}
                    {selectedEmail?.id === email.id && (
                      <div className="bg-background border-t">
                        <div className="p-3">
                          {/* Compact Email Header */}
                          <div className="mb-2 pb-2 border-b">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Avatar className="w-7 h-7 flex-shrink-0">
                                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white font-semibold text-[10px]">
                                    {getInitials(selectedEmail.fromName || selectedEmail.from)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">{selectedEmail.fromName || selectedEmail.from}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{selectedEmail.from}</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {new Date(selectedEmail.receivedAt).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            {/* Action Buttons Row */}
                            <div className="flex gap-1 flex-wrap">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReply(selectedEmail)}
                                className="h-7 text-[10px] px-2"
                              >
                                <Reply className="w-3 h-3 mr-1" />
                                Reply
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-7 text-[10px] px-2"
                              >
                                <Forward className="w-3 h-3 mr-1" />
                                Forward
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAnalyzeEmail(selectedEmail.id)}
                                disabled={analyzingEmail}
                                className="h-7 text-[10px] px-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20"
                              >
                                {analyzingEmail ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3 mr-1" />
                                )}
                                AI
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-7 px-2"
                              >
                                <Star className="w-3 h-3" />
                              </Button>
                              {selectedEmail.folder !== "trash" ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => moveToFolderMutation.mutate({ emailId: selectedEmail.id, folder: "trash" })}
                                  title="Move to Trash"
                                  className="h-7 px-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to permanently delete this email? This cannot be undone.")) {
                                      deleteEmailMutation.mutate(selectedEmail.id);
                                    }
                                  }}
                                  title="Delete Permanently"
                                  className="h-7 text-[10px] px-2"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Email Body */}
                          {loadingEmailBody ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="text-center">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-primary" />
                                <p className="text-[10px] text-muted-foreground">Loading...</p>
                              </div>
                            </div>
                          ) : (
                            <div className="max-h-[400px] overflow-y-auto">
                              {selectedEmail.body ? (
                                <div 
                                  className="email-content text-xs"
                                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                                  style={{
                                    maxWidth: '100%',
                                    lineHeight: '1.5',
                                  }}
                                />
                              ) : (
                                <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-muted">
                                  <p className="text-xs text-muted-foreground">{selectedEmail.bodyPreview}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1 italic">Full content not available</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI Analysis Results */}
                          {emailAnalysis && (
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <h4 className="font-bold text-sm">AI Analysis</h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Summary Card */}
                                <Card className="col-span-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200">
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-2">
                                      <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-xs mb-1">Summary</h5>
                                        <p className="text-xs text-foreground/80">{emailAnalysis.summary}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Sentiment */}
                                <Card>
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <TrendingUp className="w-3 h-3 text-blue-600" />
                                      <h5 className="font-semibold text-xs">Sentiment</h5>
                                    </div>
                                    <Badge 
                                      variant={
                                        emailAnalysis.sentiment === 'positive' ? 'default' : 
                                        emailAnalysis.sentiment === 'negative' ? 'destructive' : 
                                        'secondary'
                                      }
                                      className="capitalize text-[10px]"
                                    >
                                      {emailAnalysis.sentiment === 'positive' && '😊 '}
                                      {emailAnalysis.sentiment === 'negative' && '😟 '}
                                      {emailAnalysis.sentiment === 'neutral' && '😐 '}
                                      {emailAnalysis.sentiment}
                                    </Badge>
                                  </CardContent>
                                </Card>

                                {/* Priority */}
                                <Card>
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <AlertCircle className="w-3 h-3 text-orange-600" />
                                      <h5 className="font-semibold text-xs">Priority</h5>
                                    </div>
                                    <Badge 
                                      variant={
                                        emailAnalysis.priority === 'urgent' || emailAnalysis.priority === 'high' ? 'destructive' : 
                                        'secondary'
                                      }
                                      className="capitalize text-[10px]"
                                    >
                                      {emailAnalysis.priority === 'urgent' && '🔥 '}
                                      {emailAnalysis.priority === 'high' && '⚠️ '}
                                      {emailAnalysis.priority}
                                    </Badge>
                                  </CardContent>
                                </Card>

                                {/* Categories */}
                                {emailAnalysis.categories && emailAnalysis.categories.length > 0 && (
                                  <Card className="col-span-full">
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-3 h-3 text-green-600" />
                                        <h5 className="font-semibold text-xs">Categories</h5>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {emailAnalysis.categories.map((category: string, idx: number) => (
                                          <Badge key={idx} variant="outline" className="capitalize text-[10px]">
                                            {category}
                                          </Badge>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Action Items */}
                                {emailAnalysis.actionItems && emailAnalysis.actionItems.length > 0 && (
                                  <Card className="col-span-full">
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <ListChecks className="w-3 h-3 text-blue-600" />
                                        <h5 className="font-semibold text-xs">Action Items</h5>
                                      </div>
                                      <ul className="space-y-1.5">
                                        {emailAnalysis.actionItems.map((item: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2 text-xs">
                                            <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Key Points */}
                                {emailAnalysis.keyPoints && emailAnalysis.keyPoints.length > 0 && (
                                  <Card className="col-span-full">
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb className="w-3 h-3 text-yellow-600" />
                                        <h5 className="font-semibold text-xs">Key Points</h5>
                                      </div>
                                      <ul className="space-y-1.5">
                                        {emailAnalysis.keyPoints.map((point: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2 text-xs">
                                            <span className="text-muted-foreground">•</span>
                                            <span>{point}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
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
