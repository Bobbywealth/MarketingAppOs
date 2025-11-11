import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  PhoneCall,
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Voicemail,
  Clock,
  User,
  Search,
  Mic,
  MicOff,
  Video,
  MessageSquare,
  MoreVertical,
  Trash2,
  Star,
  PhoneOff,
  UserPlus,
  Settings,
  Send,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  direction: "inbound" | "outbound";
  from_number: string;
  to_numbers: string[];
  text: string;
  timestamp: string;
  status?: string;
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
  const [isDialpadVisible, setIsDialpadVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"calls" | "sms" | "contacts">("calls");
  const [smsRecipient, setSmsRecipient] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  // Check Dialpad connection status
  const { data: dialpadStatus } = useQuery({
    queryKey: ["/api/test-dialpad"],
    retry: false,
  });

  const isDialpadConfigured = dialpadStatus?.connected;

  // Fetch call logs from Dialpad API
  const { data: callLogs = [], isLoading, error: callLogsError } = useQuery<CallLog[]>({
    queryKey: ["/api/dialpad/calls"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dialpad/calls?limit=50", undefined);
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: isDialpadConfigured === true,
    retry: false,
  });

  // SMS listing is not available via Dialpad REST API
  // Only webhooks/events are supported for receiving SMS
  // For now, SMS tab will show "send only" functionality
  const smsMessages: SmsMessage[] = [];
  const smsLoading = false;

  // Fetch contacts from Dialpad API
  // Note: May require owner_id parameter or admin permissions for company contacts
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
      toast({ title: "📞 Calling...", description: `Dialing ${phoneNumber}` });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dialpad/sms"] });
      setSmsRecipient("");
      setSmsMessage("");
      toast({ title: "✅ SMS Sent!", description: "Your message was sent successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "SMS failed", 
        description: error?.message || "Unable to send SMS",
        variant: "destructive" 
      });
    },
  });

  const handleDialpadClick = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  const handleCall = () => {
    if (!phoneNumber) {
      toast({ 
        title: "Enter a phone number", 
        variant: "destructive" 
      });
      return;
    }
    makeCallMutation.mutate(phoneNumber);
  };

  const handleHangup = () => {
    setActiveCall(null);
    toast({ title: "Call ended" });
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
    sendSmsMutation.mutate({ 
      to_numbers: [smsRecipient],
      text: smsMessage 
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case "outgoing":
        return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
      case "missed":
        return <PhoneMissed className="w-4 h-4 text-red-500" />;
      default:
        return <Phone className="w-4 h-4" />;
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

  const todayCalls = callLogs.filter(call => {
    const today = new Date();
    const callDate = new Date(call.timestamp);
    return callDate.toDateString() === today.toDateString();
  });

  const callStats = {
    total: callLogs.length,
    incoming: callLogs.filter(c => c.type === "incoming").length,
    outgoing: callLogs.filter(c => c.type === "outgoing").length,
    missed: callLogs.filter(c => c.type === "missed").length,
    totalDuration: callLogs.reduce((acc, call) => acc + call.duration, 0),
  };

  return (
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Phone & SMS</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Make calls, send messages via Dialpad</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mr-2 sm:mr-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calls" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                  Calls
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  Contacts
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Settings
            </Button>
          </div>
        </div>

      {/* Dialpad Setup Alert */}
      {!isDialpadConfigured && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
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
                <li>Go to your Render dashboard → Your service → Environment</li>
                <li>Add environment variable: <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono">DIALPAD_API_KEY</code> = your_api_key</li>
                <li>Click "Save Changes" and Render will automatically redeploy</li>
                <li>Refresh this page once deployment is complete</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('https://dialpad.com/settings/integrations', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-3 h-3" />
                Get API Key
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('https://dashboard.render.com/', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-3 h-3" />
                Render Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {isDialpadConfigured && (
        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription>
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              ✅ Dialpad Connected!
            </p>
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              Your phone and SMS features are now active. You can make calls, send messages, and manage contacts.
            </p>
          </AlertDescription>
        </Alert>
      )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Calls</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{callStats.total}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg">
                  <Phone className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Incoming</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{callStats.incoming}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg">
                  <PhoneIncoming className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Outgoing</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{callStats.outgoing}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-500/10 rounded-lg">
                  <PhoneOutgoing className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Missed</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{callStats.missed}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg">
                  <PhoneMissed className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Talk Time</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{Math.floor(callStats.totalDuration / 60)}m</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Main Interface */}
      {activeTab === "contacts" ? (
        /* Contacts Interface */
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contacts ({contacts.length})</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="h-[700px]">
              <CardContent>
                {contactsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading contacts...
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">No contacts yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your Dialpad contacts will appear here
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contacts
                      .filter(contact => 
                        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((contact) => (
                        <Card key={contact.id} className="hover-elevate group">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{contact.name}</h4>
                                {contact.company && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {contact.company}
                                  </p>
                                )}
                                {contact.phones && contact.phones.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {contact.phones.slice(0, 2).map((phone, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm">
                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">{phone.value}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 opacity-0 group-hover:opacity-100"
                                          onClick={() => {
                                            setPhoneNumber(phone.value);
                                            setActiveTab("calls");
                                          }}
                                        >
                                          <PhoneCall className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {contact.emails && contact.emails.length > 0 && (
                                  <div className="mt-2">
                                    {contact.emails.slice(0, 1).map((email, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm">
                                        <span className="text-xs text-muted-foreground truncate">
                                          {email.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      ) : activeTab === "calls" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dialpad Section */}
          <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Dialpad</span>
              <Button variant="ghost" size="sm" onClick={() => setIsDialpadVisible(!isDialpadVisible)}>
                {isDialpadVisible ? "Hide" : "Show"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Number Display */}
            <div className="relative">
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-2xl text-center h-16 pr-12"
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

            {/* Dialpad Grid */}
            {isDialpadVisible && (
              <div className="grid grid-cols-3 gap-3">
                {dialpadButtons.map(({ digit, letters }) => (
                  <Button
                    key={digit}
                    variant="outline"
                    size="lg"
                    className="h-16 flex flex-col items-center justify-center hover-elevate"
                    onClick={() => handleDialpadClick(digit)}
                  >
                    <span className="text-2xl font-bold">{digit}</span>
                    {letters && (
                      <span className="text-xs text-muted-foreground">{letters}</span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* Call Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1 h-14 bg-green-500 hover:bg-green-600 text-white gap-2"
                onClick={handleCall}
                disabled={!phoneNumber || makeCallMutation.isPending}
              >
                <PhoneCall className="w-5 h-5" />
                Call
              </Button>
              {activeCall && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-14"
                  onClick={handleHangup}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Active Call Controls */}
            {activeCall && (
              <Card className="border-2 border-green-500 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Active Call</p>
                    <p className="font-semibold text-lg">{activeCall.contactName || activeCall.phoneNumber}</p>
                    <p className="text-2xl font-mono">00:45</p>
                    
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Call History */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Call History</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search calls..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <ScrollArea className="h-[600px]">
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All ({callLogs.length})</TabsTrigger>
                  <TabsTrigger value="today">Today ({todayCalls.length})</TabsTrigger>
                  <TabsTrigger value="missed">Missed ({callStats.missed})</TabsTrigger>
                  <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading call history...
                    </div>
                  ) : callLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <Phone className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-2">No call history yet</p>
                      <p className="text-sm text-muted-foreground">
                        Your calls will appear here once you connect Dialpad
                      </p>
                    </div>
                  ) : (
                    callLogs.map((call) => (
                      <Card key={call.id} className="hover-elevate group">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar>
                                <AvatarFallback>
                                  {call.contactName?.charAt(0) || call.phoneNumber.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {getCallIcon(call.type)}
                                  <p className="font-medium">
                                    {call.contactName || "Unknown"}
                                  </p>
                                  {call.type === "missed" && (
                                    <Badge variant="destructive" className="text-xs">
                                      Missed
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{call.phoneNumber}</span>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(call.timestamp), { addSuffix: true })}</span>
                                  {call.duration > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDuration(call.duration)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPhoneNumber(call.phoneNumber)}
                              >
                                <PhoneCall className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Star className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {call.notes && (
                            <p className="text-sm text-muted-foreground mt-2 ml-14">
                              {call.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="today">
                  <p className="text-center text-muted-foreground py-8">
                    {todayCalls.length} calls today
                  </p>
                </TabsContent>

                <TabsContent value="missed">
                  <p className="text-center text-muted-foreground py-8">
                    {callStats.missed} missed calls
                  </p>
                </TabsContent>

                <TabsContent value="voicemail">
                  <div className="text-center py-12">
                    <Voicemail className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">No voicemails</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
      ) : (
        /* SMS Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SMS Composer */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Send SMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={smsRecipient}
                  onChange={(e) => setSmsRecipient(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="mt-2 min-h-[150px]"
                  maxLength={1600}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {smsMessage.length} / 1600 characters
                </p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleSendSms}
                disabled={sendSmsMutation.isPending}
              >
                <Send className="w-4 h-4" />
                {sendSmsMutation.isPending ? "Sending..." : "Send SMS"}
              </Button>
            </CardContent>
          </Card>

          {/* SMS History */}
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>SMS History</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[600px]">
              <CardContent className="space-y-2">
                {smsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading messages...
                  </div>
                ) : smsMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">No SMS messages yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your messages will appear here once you connect Dialpad
                    </p>
                  </div>
                ) : (
                  smsMessages.map((msg) => (
                    <Card key={msg.id} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {msg.direction === "outbound" ? (
                                <Badge variant="default">Sent</Badge>
                              ) : (
                                <Badge variant="secondary">Received</Badge>
                              )}
                              <span className="text-sm font-medium">
                                {msg.direction === "outbound" 
                                  ? `To: ${msg.to_numbers.join(", ")}`
                                  : `From: ${msg.from_number}`
                                }
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}

