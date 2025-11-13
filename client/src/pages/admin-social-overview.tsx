import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function AdminSocialOverview() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [range, setRange] = useState<string>("30d");

  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });

  const summary = [
    { label: "Followers", value: "—" },
    { label: "Impressions", value: "—" },
    { label: "Engagements", value: "—" },
    { label: "Video Views", value: "—" },
  ];

  return (
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">Social Overview</h1>
          <p className="text-sm text-muted-foreground">Cross‑client social analytics (admin)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="twitter">Twitter/X</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search posts…" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.map((s) => (
            <Card key={s.label} className="glass-strong border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-strong border-0">
          <CardHeader>
            <CardTitle>Top Posts (placeholder)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Data will appear once integrations are connected.</div>
            <div className="text-xs text-muted-foreground">Tip: click a client to drill into their social tab.</div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          <Badge variant="secondary">Scaffold</Badge> Connect platforms per client to populate this view.
        </div>

      </div>
    </div>
  );
}


