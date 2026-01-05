import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Pencil, 
  Calendar, 
  Building2, 
  Star, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Instagram, 
  Video, 
  Youtube, 
  Globe, 
  Check, 
  X,
  FileText,
  ShieldCheck,
  MapPin,
  Clock,
  User,
  Activity,
  DollarSign,
  Receipt,
  Plus,
  ExternalLink,
  Info,
  History
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getCreatorTier = (score: string | number | null) => {
  const s = Number(score || 0);
  if (s >= 4.8) return { label: "Gold", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  if (s >= 4.0) return { label: "Silver", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
  return { label: "Bronze", color: "text-orange-700", bg: "bg-orange-700/10", border: "border-orange-700/20" };
};

type CreatorDetailResponse = {
  creator: any;
  assignments: Array<{
    id: string;
    clientId: string;
    clientName: string;
    role: "primary" | "backup";
    active: boolean;
    assignedAt?: string;
  }>;
  visits: any[];
};

export default function CreatorDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/creators/:id");
  const { toast } = useToast();
  const creatorId = params?.id;

  const { data, isLoading } = useQuery<CreatorDetailResponse>({
    queryKey: [`/api/creators/${creatorId}`],
    enabled: !!creatorId,
  });

  const [selectedVisitIds, setSelectedVisitIds] = useState<string[]>([]);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutForm, setPayoutModalForm] = useState({
    transactionId: "",
    receiptUrl: "",
    notes: "",
  });

  const creator = data?.creator;
  const assignments = data?.assignments || [];
  const visits = data?.visits || [];
  const payouts = (data as any)?.payouts || [];

  const createPayoutMutation = useMutation({
    mutationFn: async () => {
      const selectedVisits = visits.filter(v => selectedVisitIds.includes(v.id));
      const totalAmount = selectedVisits.length * (creator?.ratePerVisitCents || 0);
      
      const res = await apiRequest("POST", `/api/creators/${creatorId}/payouts`, {
        visitIds: selectedVisitIds,
        amountCents: totalAmount,
        payoutMethod: creator.payoutMethod || "manual",
        payoutDetails: creator.payoutDetails || {},
        transactionId: payoutForm.transactionId,
        receiptUrl: payoutForm.receiptUrl,
        notes: payoutForm.notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creatorId}`] });
      toast({ title: "Payout Processed", description: "The payout record has been created and visits updated." });
      setPayoutModalOpen(false);
      setSelectedVisitIds([]);
      setPayoutModalForm({ transactionId: "", receiptUrl: "", notes: "" });
    },
  });

  const toggleVisitSelection = (id: string) => {
    setSelectedVisitIds(prev => 
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnpaid = () => {
    const unpaidIds = visits
      .filter(v => v.status === 'completed' && !v.paymentReleased)
      .map(v => v.id);
    setSelectedVisitIds(unpaidIds);
  };

  const totalPaidOutCents = visits
    .filter(v => v.paymentReleased)
    .reduce((sum, v) => sum + (creator?.ratePerVisitCents || 0), 0);
  
  const pendingPayoutCents = visits
    .filter(v => v.status === 'completed' && !v.paymentReleased)
    .reduce((sum, v) => sum + (creator?.ratePerVisitCents || 0), 0);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/creators/${creatorId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creatorId}`] });
      toast({ title: "Creator Approved", description: "The creator has been approved and notified." });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/creators/${creatorId}/decline`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creatorId}`] });
      toast({ title: "Creator Declined", description: "The creator has been declined." });
    },
  });

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/creators")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex gap-2">
            {creator?.applicationStatus === "pending" && (
              <>
                <Button 
                  className="bg-green-600 hover:bg-green-700 gap-2"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                >
                  <Check className="w-4 h-4" /> Accept Creator
                </Button>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={() => declineMutation.mutate()}
                  disabled={declineMutation.isPending}
                >
                  <X className="w-4 h-4" /> Decline Creator
                </Button>
              </>
            )}
            {creatorId && (
              <Button variant="outline" onClick={() => setLocation(`/creators/${creatorId}/edit`)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading…</div>
        ) : !creator ? (
          <div className="py-10 text-center text-muted-foreground">Creator not found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={
                        creator.applicationStatus === "accepted" ? "default" : 
                        creator.applicationStatus === "pending" ? "secondary" : 
                        "destructive"
                      } className="capitalize px-3 py-1">
                        Application: {creator.applicationStatus || "pending"}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Applied on {new Date(creator.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold flex items-center gap-3">
                      <span>{creator.fullName}</span>
                      {(() => {
                        const tier = getCreatorTier(creator.performanceScore);
                        return (
                          <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tier.bg} ${tier.color} ${tier.border}`}>
                            <Award className="w-3.5 h-3.5" />
                            {tier.label} Tier
                          </div>
                        );
                      })()}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4" />
                      {creator.homeCity || "Unknown City"}, {creator.baseZip || "No Zip"} • {creator.serviceRadiusMiles || 25}mi radius
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Contact Info</div>
                      <div className="text-sm font-medium">{creator.email || "—"}</div>
                      <div className="text-sm text-muted-foreground">{creator.phone || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Visit Rate</div>
                      <div className="text-xl font-bold text-blue-600">${(Number(creator.ratePerVisitCents) / 100).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Internal Rate</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Performance</div>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-xl">{creator.performanceScore ?? "5.0"}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t bg-slate-50/50">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Paid Out</div>
                      <div className="text-xl font-black text-green-600">${(totalPaidOutCents / 100).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending Payout</div>
                      <div className="text-xl font-black text-amber-600">${(pendingPayoutCents / 100).toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      Social Media & Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instagram</div>
                      {creator.instagramUsername ? (
                        <a href={`https://instagram.com/${creator.instagramUsername}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 font-bold hover:underline flex items-center gap-1">
                          @{creator.instagramUsername} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : "Not provided"}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">TikTok</div>
                      {creator.tiktokUsername ? (
                        <a href={`https://tiktok.com/@${creator.tiktokUsername}`} target="_blank" rel="noopener noreferrer" className="text-slate-900 font-bold hover:underline flex items-center gap-1">
                          @{creator.tiktokUsername} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : "—"}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">YouTube</div>
                      {creator.youtubeHandle ? (
                        <div className="font-bold text-red-600 truncate">{creator.youtubeHandle}</div>
                      ) : "—"}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Portfolio</div>
                      {creator.portfolioUrl ? (
                        <a href={creator.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                          View Work <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : "—"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Industries & Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Primary Industries</div>
                      <div className="flex flex-wrap gap-2">
                        {creator.industries?.map((ind: string) => (
                          <Badge key={ind} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">{ind}</Badge>
                        )) || "No industries selected"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Availability Notes</div>
                      <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 italic leading-relaxed">
                        {creator.availabilityNotes || "No availability notes provided."}
                      </p>
                    </div>

                    <div className="pt-4 space-y-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payout Information</div>
                      <div className="p-4 rounded-2xl border bg-slate-50 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Preferred Method</div>
                          <div className="font-bold text-blue-600 capitalize">{creator.payoutMethod || "Not set"}</div>
                        </div>
                        {creator.payoutDetails && (
                          <div className="text-right">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Details</div>
                            <div className="text-sm font-medium">
                              {creator.payoutMethod === 'paypal' && creator.payoutDetails.email}
                              {creator.payoutMethod === 'venmo' && `@${creator.payoutDetails.username}`}
                              {creator.payoutMethod === 'zelle' && creator.payoutDetails.id}
                              {creator.payoutMethod === 'bank_transfer' && `ACH: ****${creator.payoutDetails.account?.slice(-4)}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Availability Calendar</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="border rounded-2xl p-4 bg-white shadow-sm">
                          <CalendarUI
                            mode="single"
                            className="rounded-md"
                            modifiers={{
                              available: (date) => creator.availability?.[format(date, "yyyy-MM-dd")] === "available",
                              unavailable: (date) => creator.availability?.[format(date, "yyyy-MM-dd")] === "unavailable",
                            }}
                            modifiersClassNames={{
                              available: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 rounded-md",
                              unavailable: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 rounded-md",
                            }}
                          />
                          <div className="mt-4 flex flex-wrap gap-4 text-xs px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full" />
                              <span className="font-medium">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full" />
                              <span className="font-medium">Unavailable</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                            <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              Admin Note
                            </h4>
                            <p className="text-xs text-blue-800 leading-relaxed">
                              This calendar shows the creator's self-reported availability. Green dates indicate they have explicitly marked themselves as available, while red dates indicate they are unavailable.
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheduled Visits</div>
                            {visits.filter(v => v.status === 'scheduled').length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">No upcoming visits scheduled.</p>
                            ) : (
                              <div className="space-y-2">
                                {visits.filter(v => v.status === 'scheduled').map(v => (
                                  <div key={v.id} className="text-xs p-2 rounded-lg border bg-white flex items-center justify-between">
                                    <span className="font-medium">{format(new Date(v.scheduledStart), 'MMM d, h:mm a')}</span>
                                    <Badge variant="outline" className="text-[10px]">{v.status}</Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-400" />
                      Legal Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-sm">Creator Terms</span>
                      <Badge variant={creator.termsSigned ? "default" : "outline"} className={creator.termsSigned ? "bg-green-500 hover:bg-green-600 border-0" : "text-white border-white/20"}>
                        {creator.termsSigned ? "Signed" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-sm">Liability Waiver</span>
                      <Badge variant={creator.waiverSigned ? "default" : "outline"} className={creator.waiverSigned ? "bg-green-500 hover:bg-green-600 border-0" : "text-white border-white/20"}>
                        {creator.waiverSigned ? "Signed" : "Missing"}
                      </Badge>
                    </div>
                    {creator.termsSignedAt && (
                      <div className="pt-2 text-[10px] text-white/40 space-y-1">
                        <div>SIGNED ON: {new Date(creator.termsSignedAt).toLocaleString()}</div>
                        <div>IP ADDRESS: {creator.ipAddress || "Unknown"}</div>
                        <div>TERMS VER: {creator.termsVersion || "1.0"}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Internal Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {creator.notes || "No internal notes."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Visit History & Payouts
                  </CardTitle>
                  <div className="flex gap-2">
                    {selectedVisitIds.length > 0 && (
                      <Button size="sm" onClick={() => setPayoutModalOpen(true)} className="gap-2">
                        <DollarSign className="w-4 h-4" />
                        Payout Selected ({selectedVisitIds.length})
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handleSelectAllUnpaid}>
                      Select Unpaid
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visits.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic py-4 text-center">No visits yet.</div>
                  ) : (
                    visits.slice(0, 15).map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          {!v.paymentReleased && v.status === 'completed' && (
                            <Checkbox 
                              checked={selectedVisitIds.includes(v.id)}
                              onCheckedChange={() => toggleVisitSelection(v.id)}
                            />
                          )}
                          <div className="text-sm">
                            <div className="font-bold flex items-center gap-2">
                              <Link href={`/visits/${v.id}`} className="hover:underline">Visit</Link>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{format(new Date(v.scheduledStart), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Status: <span className="font-bold text-foreground">{v.status}</span> • 
                              Upload: <span className={`font-bold ${v.uploadReceived ? 'text-green-600' : 'text-amber-600'}`}>{v.uploadReceived ? "Received" : "Missing"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-blue-600">${(creator?.ratePerVisitCents / 100).toFixed(2)}</div>
                          <Badge variant={v.paymentReleased ? "default" : "outline"} className={v.paymentReleased ? "bg-green-500 hover:bg-green-600 text-[10px] py-0 h-4" : "text-[10px] py-0 h-4"}>
                            {v.paymentReleased ? "PAID" : "UNPAID"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Payout History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payouts.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic py-4 text-center">No payout history found.</div>
                  ) : (
                    payouts.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                        <div className="space-y-1">
                          <div className="text-sm font-bold flex items-center gap-2">
                            <span>Payout {format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">{p.payoutMethod}</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            ID: <span className="font-mono">{p.transactionId || "MANUAL"}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div className="text-base font-black text-green-600">${(p.amountCents / 100).toFixed(2)}</div>
                          {p.receiptUrl && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                              <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer">
                                <Receipt className="w-4 h-4 text-primary" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payout Dialog */}
            <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Process Payout</DialogTitle>
                  <DialogDescription>
                    Create a payout record for {selectedVisitIds.length} visits. This will mark them as paid.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-blue-50 border rounded-2xl flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-900">Total Payout Amount:</div>
                    <div className="text-2xl font-black text-blue-600">${((selectedVisitIds.length * (creator?.ratePerVisitCents || 0)) / 100).toFixed(2)}</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Transaction ID (Optional)</Label>
                    <Input 
                      placeholder="e.g. PayPal Transaction ID" 
                      value={payoutForm.transactionId}
                      onChange={(e) => setPayoutModalForm({...payoutForm, transactionId: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Receipt URL / Link (Optional)</Label>
                    <Input 
                      placeholder="https://..." 
                      value={payoutForm.receiptUrl}
                      onChange={(e) => setPayoutModalForm({...payoutForm, receiptUrl: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Input 
                      placeholder="Any internal notes about this payout" 
                      value={payoutForm.notes}
                      onChange={(e) => setPayoutModalForm({...payoutForm, notes: e.target.value})}
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Creator Payout Info</div>
                    <div className="text-xs font-bold text-blue-600 capitalize">{creator.payoutMethod || "No method set"}</div>
                    <div className="text-[10px] font-medium">
                      {creator.payoutMethod === 'paypal' && creator.payoutDetails?.email}
                      {creator.payoutMethod === 'venmo' && `@${creator.payoutDetails?.username}`}
                      {creator.payoutMethod === 'zelle' && creator.payoutDetails?.id}
                      {creator.payoutMethod === 'bank_transfer' && `ACH: ****${creator.payoutDetails?.account?.slice(-4)}`}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPayoutModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => createPayoutMutation.mutate()} disabled={createPayoutMutation.isPending}>
                    {createPayoutMutation.isPending ? "Saving..." : "Confirm Payout"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}






