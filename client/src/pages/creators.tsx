import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  UsersRound, 
  Star, 
  MapPin, 
  Award, 
  Check, 
  X, 
  Clock, 
  Instagram, 
  Info,
  ExternalLink
} from "lucide-react";

const getCreatorTier = (score: string | number | null) => {
  const s = Number(score || 0);
  if (s >= 4.8) return { label: "Gold", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  if (s >= 4.0) return { label: "Silver", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
  return { label: "Bronze", color: "text-orange-700", bg: "bg-orange-700/10", border: "border-orange-700/20" };
};

type CreatorRow = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  homeCity?: string | null;
  baseZip?: string | null;
  serviceZipCodes?: string[] | null;
  serviceRadiusMiles?: number | null;
  ratePerVisitCents: number;
  status: "active" | "backup" | "inactive";
  applicationStatus: "pending" | "accepted" | "declined";
  instagramUsername?: string | null;
  termsSigned?: boolean;
  waiverSigned?: boolean;
  performanceScore?: string | number | null;
  createdAt?: string | null;
};

export default function CreatorsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [city, setCity] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [appStatus, setAppStatus] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("");

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (zip.trim()) params.set("zip", zip.trim());
    if (status !== "all") params.set("status", status);
    if (appStatus !== "all") params.set("applicationStatus", appStatus);
    if (minScore.trim()) params.set("minScore", minScore.trim());
    const qs = params.toString();
    return qs ? `/api/creators?${qs}` : "/api/creators";
  }, [city, zip, status, appStatus, minScore]);

  const { data: creators = [], isLoading, error } = useQuery<CreatorRow[]>({
    queryKey: [queryUrl],
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/creators/${id}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryUrl] });
      toast({ title: "Creator Approved", description: "The creator has been approved and notified." });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/creators/${id}/decline`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryUrl] });
      toast({ title: "Creator Declined", description: "The creator has been declined." });
    },
  });

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Creators</h1>
            <p className="text-muted-foreground">Manage local creators, assignments, and visit history.</p>
          </div>
          <Button onClick={() => setLocation("/creators/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Creator
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersRound className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin" />
            </div>
            <div className="space-y-2">
              <Label>Zip</Label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="e.g. 78701" />
            </div>
            <div className="space-y-2">
              <Label>Application Status</Label>
              <Select value={appStatus} onValueChange={setAppStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Network Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Min Score</Label>
              <Input value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="e.g. 4.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creators & Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading creators…</div>
            ) : error ? (
              <div className="py-10 text-center text-muted-foreground">Failed to load creators.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Legal Status</TableHead>
                    <TableHead>App Status</TableHead>
                    <TableHead>Tier / Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creators.map((c) => {
                    const tier = getCreatorTier(c.performanceScore);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium cursor-pointer" onClick={() => setLocation(`/creators/${c.id}`)}>
                          <div>{c.fullName}</div>
                          <div className="text-xs text-muted-foreground font-normal">{c.email}</div>
                          <div className="text-xs text-muted-foreground font-normal">{c.phone}</div>
                        </TableCell>
                        <TableCell>
                          {c.instagramUsername ? (
                            <a 
                              href={`https://instagram.com/${c.instagramUsername}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-pink-600 hover:underline font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram className="w-3.5 h-3.5" />
                              @{c.instagramUsername}
                            </a>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {c.homeCity || "—"}
                            <div className="text-xs text-muted-foreground">{c.baseZip} ({c.serviceRadiusMiles || 25}mi)</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <div title="Terms & Conditions" className={`p-1 rounded ${c.termsSigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                              <Info className="w-4 h-4" />
                            </div>
                            <div title="Liability Waiver" className={`p-1 rounded ${c.waiverSigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            c.applicationStatus === "accepted" ? "default" : 
                            c.applicationStatus === "pending" ? "secondary" : 
                            "destructive"
                          } className="capitalize">
                            {c.applicationStatus || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tier.bg} ${tier.color} ${tier.border} uppercase`}>
                              <Award className="w-2.5 h-2.5" />
                              {tier.label}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{c.performanceScore ?? "5.0"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {c.applicationStatus === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="h-8 bg-green-600 hover:bg-green-700"
                                  onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(c.id); }}
                                  disabled={acceptMutation.isPending}
                                >
                                  <Check className="w-4 h-4 mr-1" /> Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  className="h-8"
                                  onClick={(e) => { e.stopPropagation(); declineMutation.mutate(c.id); }}
                                  disabled={declineMutation.isPending}
                                >
                                  <X className="w-4 h-4 mr-1" /> Decline
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setLocation(`/creators/${c.id}`)}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {creators.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No creators found matching these filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            <div className="pt-4 text-sm text-muted-foreground">
              <Link href="/visits" className="underline">
                Go to Visits
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





