import { useLocation, useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Calendar, Building2, Star, Award, TrendingUp, TrendingDown } from "lucide-react";

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
  const creatorId = params?.id;

  const { data, isLoading } = useQuery<CreatorDetailResponse>({
    queryKey: [`/api/creators/${creatorId}`],
    enabled: !!creatorId,
  });

  const creator = data?.creator;
  const assignments = data?.assignments || [];
  const visits = data?.visits || [];

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/creators")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          {creatorId && (
            <Button variant="outline" onClick={() => setLocation(`/creators/${creatorId}/edit`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading…</div>
        ) : !creator ? (
          <div className="py-10 text-center text-muted-foreground">Creator not found.</div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span>{creator.fullName}</span>
                    <Badge variant={creator.status === "active" ? "default" : creator.status === "backup" ? "secondary" : "outline"}>
                      {creator.status}
                    </Badge>
                    {(() => {
                      const tier = getCreatorTier(creator.performanceScore);
                      return (
                        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tier.bg} ${tier.color} ${tier.border}`}>
                          <Award className="w-3.5 h-3.5" />
                          {tier.label} Tier
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-lg">{creator.performanceScore ?? "5.0"}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Contact</div>
                  <div className="text-sm">{creator.email || "—"}</div>
                  <div className="text-sm font-medium">{creator.phone || "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="text-sm">{creator.homeCity || "—"}</div>
                  <div className="text-sm font-medium">{creator.baseZip || "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rate / Visit</div>
                  <div className="text-lg font-semibold">${(Number(creator.ratePerVisitCents) / 100).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Performance Trend</div>
                  <div className="flex items-center gap-2 text-emerald-600 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span>+0.2 this month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

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





