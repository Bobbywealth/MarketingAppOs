import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, UsersRound, Star, MapPin, Award } from "lucide-react";

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
  performanceScore?: string | number | null;
  createdAt?: string | null;
};

export default function CreatorsPage() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("");

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (zip.trim()) params.set("zip", zip.trim());
    if (status !== "all") params.set("status", status);
    if (minScore.trim()) params.set("minScore", minScore.trim());
    const qs = params.toString();
    return qs ? `/api/creators?${qs}` : "/api/creators";
  }, [city, zip, status, minScore]);

  const { data: creators = [], isLoading, error } = useQuery<CreatorRow[]>({
    queryKey: [queryUrl],
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
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin" />
            </div>
            <div className="space-y-2">
              <Label>Zip</Label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="e.g. 78701" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
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
            <CardTitle>Creators</CardTitle>
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
                    <TableHead>Name</TableHead>
                    <TableHead>City / Zip</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creators.map((c) => {
                    const tier = getCreatorTier(c.performanceScore);
                    return (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => setLocation(`/creators/${c.id}`)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {c.fullName}
                          </div>
                          {(c.email || c.phone) && (
                            <div className="text-xs text-muted-foreground">
                              {c.email || c.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{c.homeCity || "—"}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{c.baseZip || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.status === "active" ? "default" : c.status === "backup" ? "secondary" : "outline"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${tier.bg} ${tier.color} ${tier.border}`}>
                            <Award className="w-3 h-3" />
                            {tier.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span>{c.performanceScore ?? "5.0"}</span>
                          </div>
                        </TableCell>
                        <TableCell>${(c.ratePerVisitCents / 100).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {creators.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No creators found.
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





