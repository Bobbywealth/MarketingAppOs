import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Activity
} from "lucide-react";

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

  const creator = data?.creator;
  const assignments = data?.assignments || [];
  const visits = data?.visits || [];

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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Active Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No active assignments.</div>
                  ) : (
                    assignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div>
                          <div className="font-medium">
                            <Link href={`/clients/${a.clientId}`} className="underline">
                              {a.clientName}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground">Role: {a.role}</div>
                        </div>
                        <Badge variant={a.role === "primary" ? "default" : "secondary"}>{a.role}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Recent Visits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visits.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No visits yet.</div>
                  ) : (
                    visits.slice(0, 10).map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="text-sm">
                          <div className="font-medium">
                            <Link href={`/visits/${v.id}`} className="underline">
                              Visit
                            </Link>
                            <span className="text-muted-foreground"> • {new Date(v.scheduledStart).toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Status: {v.status} • Upload: {v.uploadReceived ? "received" : "missing"} • Approved: {v.approved ? "yes" : "no"}
                          </div>
                        </div>
                        <Badge variant={v.uploadOverdue ? "destructive" : "secondary"}>{v.uploadOverdue ? "Upload Overdue" : v.status}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}





