import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
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
  Settings
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

export default function PhonePage() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDialpadVisible, setIsDialpadVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Mock data - will be replaced with Dialpad API
  const { data: callLogs = [], isLoading } = useQuery<CallLog[]>({
    queryKey: ["/api/calls"],
    queryFn: async () => {
      // TODO: Replace with Dialpad API integration
      return [];
    },
  });

  const makeCallMutation = useMutation({
    mutationFn: async (number: string) => {
      // TODO: Integrate with Dialpad API
      return apiRequest("POST", "/api/calls/make", { phoneNumber: number });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phone & Calling</h1>
          <p className="text-muted-foreground">Make calls and manage communications via Dialpad</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{callStats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incoming</p>
                <p className="text-2xl font-bold">{callStats.incoming}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <PhoneIncoming className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outgoing</p>
                <p className="text-2xl font-bold">{callStats.outgoing}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <PhoneOutgoing className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missed</p>
                <p className="text-2xl font-bold">{callStats.missed}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <PhoneMissed className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Talk Time</p>
                <p className="text-2xl font-bold">{Math.floor(callStats.totalDuration / 60)}m</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
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
    </div>
  );
}

