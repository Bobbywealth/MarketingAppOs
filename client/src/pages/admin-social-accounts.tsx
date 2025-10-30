import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSocialAccounts() {
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });
  // Placeholder accounts list; real data will come from /api/social/accounts
  return (
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Social Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage connections, status, and sync health</p>
        </div>

        <Card className="glass-strong border-0">
          <CardHeader>
            <CardTitle>Connections (placeholder)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {clients.slice(0, 6).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg hover-elevate">
                <div className="font-medium">{c.name}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">No accounts</Badge>
                  <span className="text-xs text-muted-foreground">Connect on client Social tab</span>
                </div>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="text-sm text-muted-foreground">No clients yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


