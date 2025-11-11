import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  PhoneCall,
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Clock,
  User,
  Search,
  MessageSquare,
  Send,
  AlertCircle,
  ExternalLink,
  Mail,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { formatDistanceToNow, format as formatDate } from "date-fns";

interface CallLog {
  id: string;
  type: "incoming" | "outgoing" | "missed";
  contact: string;
  contactName?: string;
  phoneNumber: string;
  duration: number; // seconds
  timestamp: string;
  notes?: string;
  recordingUrl?: string;
}

interface SmsMessage {
  id: string;
  dialpadId?: string;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  text: string;
  timestamp: string;
  status?: string;
  createdAt?: string;
}

interface Contact {
  id: string;
  name: string;
  phones?: Array<{ type: string; value: string }>;
  emails?: Array<{ type: string; value: string }>;
  company?: string;
}

export default function PhonePage() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"calls" | "sms" | "contacts">("calls");
  const [smsRecipient, setSmsRecipient] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  // Handle URL parameters for pre-filling phone number from leads page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const number = params.get('number');
    const action = params.get('action');

    if (number) {
      if (action === 'sms') {
        setSmsRecipient(number);
        setActiveTab('sms');
        toast({
          title: "Ready to send SMS",
          description: `Recipient: ${number}`,
        });
      } else if (action === 'call') {
        setPhoneNumber(number);
        setActiveTab('calls');
        toast({
          title: "Ready to call",
          description: `Number: ${number}`,
        });
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/phone');
    }
  }, [toast]);

  // Debug: Log SMS recipient changes
  useEffect(() => {
    if (smsRecipient) {
      console.log('✅ SMS Recipient is set to:', smsRecipient);
    }
  }, [smsRecipient]);

  // Check Dialpad connection status
  const { data: dialpadStatus } = useQuery({
    queryKey: ["/api/test-dialpad"],
    retry: false,
  });

  const isDialpadConfigured = dialpadStatus?.connected;

  // Fetch call logs from Dialpad API
  const { data: callLogs = [], isLoading } = useQuery<CallLog[]>({
    queryKey: ["/api/dialpad/calls"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dialpad/calls?limit=50", undefined);
      return response.json();
    },
    refetchInterval: 30000,
    enabled: isDialpadConfigured === true,
    retry: false,
  });

  // Fetch SMS messages from database (populated by webhook)
  const { data: smsMessages = [], isLoading: smsLoading } = useQuery<SmsMessage[]>({
    queryKey: ["/api/dialpad/sms"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dialpad/sms", undefined);
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: isDialpadConfigured === true,
    retry: false,
  });

  // Fetch contacts from Dialpad API
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/dialpad/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dialpad/contacts?limit=50", undefined);
      return response.json();
    },
    enabled: isDialpadConfigured === true,
    retry: false,
  });

  const makeCallMutation = useMutation({
    mutationFn: async (number: string) => {
      return apiRequest("POST", "/api/dialpad/calls", { to_number: number });
    },
    onSuccess: () => {
      toast({ title: "📞 Call Initiated", description: `Calling ${phoneNumber} via Dialpad...` });
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Call failed", 
        description: error?.message || "Unable to place call",
        variant: "destructive" 
      });
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: { to_numbers: string[]; text: string }) => {
      return apiRequest("POST", "/api/dialpad/sms", data);
    },
    onSuccess: () => {
      setSmsRecipient("");
      setSmsMessage("");
      toast({ title: "✅ SMS Sent!", description: "Your message was delivered successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "SMS failed", 
        description: error?.message || "Unable to send SMS",
        variant: "destructive" 
      });
    },
  });

  // Format phone number to E.164 format (international format)
  const formatPhoneNumber = (number: string): string => {
    let cleaned = number.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('1') && cleaned.length === 11) return '+' + cleaned;
    if (cleaned.length === 10) return '+1' + cleaned;
    return '+1' + cleaned;
  };

  const handleDialpadClick = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  const handleCall = () => {
    if (!phoneNumber) {
      toast({ title: "Enter a phone number", variant: "destructive" });
      return;
    }
    const formattedNumber = formatPhoneNumber(phoneNumber);
    makeCallMutation.mutate(formattedNumber);
  };

  const handleSendSms = () => {
    if (!smsRecipient || !smsMessage) {
      toast({ 
        title: "Missing information", 
        description: "Please enter both recipient number and message",
        variant: "destructive" 
      });
      return;
    }
    const formattedNumber = formatPhoneNumber(smsRecipient);
    sendSmsMutation.mutate({ 
      to_numbers: [formattedNumber],
      text: smsMessage 
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m ${secs}s`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <PhoneIncoming className="w-4 h-4" />;
      case "outgoing":
        return <PhoneOutgoing className="w-4 h-4" />;
      case "missed":
        return <PhoneMissed className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const getCallColor = (type: string) => {
    switch (type) {
      case "incoming":
        return "text-green-600 bg-green-50 dark:bg-green-950";
      case "outgoing":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950";
      case "missed":
        return "text-red-600 bg-red-50 dark:bg-red-950";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950";
    }
  };

  const dialpadButtons = [
    { digit: "1", letters: "" },
    { digit: "2", letters: "ABC" },
    { digit: "3", letters: "DEF" },
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
    { digit: "*", letters: "" },
    { digit: "0", letters: "+" },
    { digit: "#", letters: "" },
  ];

  const callStats = {
    total: callLogs.length,
    incoming: callLogs.filter(c => c.type === "incoming").length,
    outgoing: callLogs.filter(c => c.type === "outgoing").length,
    missed: callLogs.filter(c => c.type === "missed").length,
  };

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-[1800px] mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Communications</h1>
          <p className="text-muted-foreground">Make calls, send SMS, and manage contacts via Dialpad</p>
        </div>

        {/* Dialpad Setup Alert */}
        {!isDialpadConfigured && (
          <Alert className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex flex-col gap-3">
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  🔌 Dialpad Not Connected
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  To enable phone calls and SMS, you need to connect your Dialpad account.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  📋 Setup Instructions:
                </p>
                <ol className="text-xs text-amber-800 dark:text-amber-200 space-y-1.5 list-decimal list-inside">
                  <li>Get your Dialpad API key from <a href="https://dialpad.com/settings/integrations" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1 hover:text-amber-600">dialpad.com/settings/integrations <ExternalLink className="w-3 h-3" /></a></li>
                  <li>Add environment variable: <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono">DIALPAD_API_KEY</code></li>
                  <li>Restart your server</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Row */}
        {isDialpadConfigured && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
                    <p className="text-2xl font-bold">{callStats.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Incoming</p>
                    <p className="text-2xl font-bold text-green-600">{callStats.incoming}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Outgoing</p>
                    <p className="text-2xl font-bold text-blue-600">{callStats.outgoing}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Missed</p>
                    <p className="text-2xl font-bold text-red-600">{callStats.missed}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                    <PhoneMissed className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          
          {/* Left Column - Actions Panel */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calls" className="gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Calls</span>
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">SMS</span>
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Contacts</span>
                </TabsTrigger>
              </TabsList>

              {/* Calls Dialpad */}
              <TabsContent value="calls" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Make a Call
                    </CardTitle>
                    <CardDescription>Enter a phone number to place a call via Dialpad</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Phone Number Display */}
                    <div className="relative">
                      <Input
                        type="tel"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-14 text-2xl text-center font-mono tracking-wider"
                      />
                      {phoneNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setPhoneNumber(phoneNumber.slice(0, -1))}
                        >
                          ⌫
                        </Button>
                      )}
                    </div>

                    {/* Dialpad */}
                    <div className="grid grid-cols-3 gap-2">
                      {dialpadButtons.map((btn) => (
                        <Button
                          key={btn.digit}
                          variant="outline"
                          className="h-16 flex flex-col items-center justify-center hover:bg-primary/10 transition-colors"
                          onClick={() => handleDialpadClick(btn.digit)}
                        >
                          <span className="text-2xl font-semibold">{btn.digit}</span>
                          {btn.letters && (
                            <span className="text-xs text-muted-foreground">{btn.letters}</span>
                          )}
                        </Button>
                      ))}
                    </div>

                    {/* Call Button */}
                    <Button 
                      className="w-full h-14 text-lg gap-2" 
                      onClick={handleCall}
                      disabled={!phoneNumber || !isDialpadConfigured || makeCallMutation.isPending}
                    >
                      <PhoneCall className="w-5 h-5" />
                      {makeCallMutation.isPending ? "Calling..." : "Call"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SMS Composer */}
              <TabsContent value="sms" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Send SMS
                    </CardTitle>
                    <CardDescription>Compose and send text messages via Dialpad</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipient</label>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={smsRecipient}
                        onChange={(e) => setSmsRecipient(e.target.value)}
                        className={`font-mono ${smsRecipient ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
                      />
                      {smsRecipient && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          ✓ Recipient ready
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (smsRecipient && smsMessage && !sendSmsMutation.isPending) {
                              handleSendSms();
                            }
                          }
                        }}
                        rows={6}
                        className="resize-none"
                        autoFocus={activeTab === "sms" && !!smsRecipient}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {smsMessage.length} characters • Press Enter to send
                      </p>
                    </div>

                    <Button 
                      className="w-full gap-2" 
                      onClick={handleSendSms}
                      disabled={!smsRecipient || !smsMessage || !isDialpadConfigured || sendSmsMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                      {sendSmsMutation.isPending ? "Sending..." : "Send SMS"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contacts Quick View */}
              <TabsContent value="contacts" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Quick Dial
                    </CardTitle>
                    <CardDescription>Select a contact to call or message</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <ScrollArea className="h-[400px]">
                      {contactsLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-sm text-muted-foreground">Loading contacts...</p>
                        </div>
                      ) : contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                          <User className="w-12 h-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No contacts found</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {contacts
                            .filter(contact => 
                              contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((contact) => (
                              <div 
                                key={contact.id}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {contact.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{contact.name}</p>
                                  {contact.company && (
                                    <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                                  )}
                                  {contact.phones && contact.phones.length > 0 && (
                                    <p className="text-xs text-muted-foreground">{contact.phones[0].value}</p>
                                  )}
                                </div>
                                {contact.phones && contact.phones.length > 0 && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setPhoneNumber(contact.phones![0].value);
                                        setActiveTab("calls");
                                      }}
                                    >
                                      <PhoneCall className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSmsRecipient(contact.phones![0].value);
                                        setActiveTab("sms");
                                      }}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - History/List Panel */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {activeTab === "calls" && (
                        <>
                          <Clock className="w-5 h-5" />
                          Call History
                        </>
                      )}
                      {activeTab === "sms" && (
                        <>
                          <MessageSquare className="w-5 h-5" />
                          SMS Messages
                        </>
                      )}
                      {activeTab === "contacts" && (
                        <>
                          <User className="w-5 h-5" />
                          All Contacts
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === "calls" && `${callLogs.length} total calls`}
                      {activeTab === "sms" && "SMS history not available via REST API"}
                      {activeTab === "contacts" && `${contacts.length} contacts`}
                    </CardDescription>
                  </div>
                  {activeTab !== "sms" && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-[200px]"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  {/* Call History */}
                  {activeTab === "calls" && (
                    isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">Loading call history...</p>
                      </div>
                    ) : callLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                        <Phone className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No calls yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {callLogs
                          .filter(call => 
                            call.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            call.phoneNumber?.includes(searchQuery)
                          )
                          .map((call) => (
                            <div 
                              key={call.id}
                              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors group"
                            >
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getCallColor(call.type)}`}>
                                {getCallIcon(call.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{call.contactName || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground font-mono">{call.phoneNumber}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span className="capitalize">{call.type}</span>
                                  <Minus className="w-3 h-3" />
                                  <span>{formatDuration(call.duration)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {call.timestamp && !isNaN(new Date(call.timestamp).getTime())
                                    ? formatDate(new Date(call.timestamp), "MMM d, h:mm a")
                                    : "Invalid date"}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setPhoneNumber(call.phoneNumber)}
                                >
                                  <PhoneCall className="w-3 h-3 mr-1" />
                                  Call Back
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )
                  )}

                  {/* SMS History */}
                  {activeTab === "sms" && (
                    smsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">Loading SMS messages...</p>
                      </div>
                    ) : smsMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No SMS Messages Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          SMS messages will appear here once you send or receive them via Dialpad.
                          Make sure your webhook is configured in Dialpad settings.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {smsMessages
                          .filter(msg => 
                            msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            msg.fromNumber?.includes(searchQuery) ||
                            msg.toNumber?.includes(searchQuery)
                          )
                          .map((msg) => (
                            <div 
                              key={msg.id}
                              className={`p-4 rounded-lg border transition-colors ${
                                msg.direction === 'inbound' 
                                  ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200' 
                                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  msg.direction === 'inbound' 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  <MessageSquare className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-medium">
                                      {msg.direction === 'inbound' ? 'From' : 'To'}: {msg.direction === 'inbound' ? msg.fromNumber : msg.toNumber}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                    </p>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                  {msg.status && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Status: {msg.status}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const number = msg.direction === 'inbound' ? msg.fromNumber : msg.toNumber;
                                    setSmsRecipient(number);
                                    setActiveTab("sms");
                                  }}
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )
                  )}

                  {/* Contacts List */}
                  {activeTab === "contacts" && (
                    contactsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">Loading contacts...</p>
                      </div>
                    ) : contacts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                        <User className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No contacts found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {contacts
                          .filter(contact => 
                            contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((contact) => (
                            <div 
                              key={contact.id}
                              className="p-4 rounded-lg border hover:bg-accent transition-colors group"
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                    {contact.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-lg">{contact.name}</p>
                                  {contact.company && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                      <Building2 className="w-3 h-3" />
                                      {contact.company}
                                    </p>
                                  )}
                                  {contact.phones && contact.phones.length > 0 ? (
                                    <div className="mt-2 space-y-1">
                                      {contact.phones.map((phone, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                          <Phone className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-muted-foreground font-mono flex-1">{phone.value}</span>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPhoneNumber(phone.value);
                                                setActiveTab("calls");
                                                toast({
                                                  title: "Ready to call",
                                                  description: phone.value,
                                                });
                                              }}
                                              title="Call this number"
                                            >
                                              <PhoneCall className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSmsRecipient(phone.value);
                                                setActiveTab("sms");
                                                toast({
                                                  title: "Ready to send SMS",
                                                  description: phone.value,
                                                });
                                              }}
                                              title="Send SMS"
                                            >
                                              <MessageSquare className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mt-2">No phone number</p>
                                  )}
                                  {contact.emails && contact.emails.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {contact.emails.map((email, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                          <Mail className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-muted-foreground">{email.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
