import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Instagram, 
  Youtube, 
  Users, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SocialAccount {
  id: string;
  clientId: string;
  platform: string;
  handle: string;
  displayName?: string;
  profileUrl?: string;
  status: string;
  lastScrapedAt?: string;
  lastError?: string;
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600" },
  { value: "tiktok", label: "TikTok", icon: Users, color: "text-black dark:text-white" },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
];

export function SocialAccountManager({ clientId, isAdmin = false }: { clientId?: string, isAdmin?: boolean }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ platform: "instagram", handle: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = isAdmin && clientId 
    ? [`/api/social/admin/accounts`, { clientId }] 
    : [`/api/social/accounts`];

  const { data: accounts = [], isLoading } = useQuery<SocialAccount[]>({
    queryKey,
    queryFn: async () => {
      const url = isAdmin && clientId 
        ? `/api/social/admin/accounts?clientId=${clientId}` 
        : `/api/social/accounts`;
      const res = await apiRequest("GET", url);
      return res.json();
    }
  });

  const addAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/social/accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAdding(false);
      setNewAccount({ platform: "instagram", handle: "" });
      toast({ title: "Account added", description: "Social account has been connected." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add account", description: error.message, variant: "destructive" });
    }
  });

  const refreshMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const url = isAdmin 
        ? `/api/social/admin/accounts/${accountId}/refresh`
        : `/api/social/accounts/${accountId}/refresh`;
      const res = await apiRequest("POST", url);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/social/metrics"] });
      toast({ title: "Refresh successful", description: "Social stats have been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Refresh failed", description: error.message, variant: "destructive" });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("DELETE", `/api/social/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Account removed" });
    }
  });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    addAccountMutation.mutate({ ...newAccount, clientId });
  };

  if (isLoading) return <div>Loading accounts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Connected Social Accounts</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Connect Account
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={newAccount.platform} 
                  onValueChange={(val) => setNewAccount({ ...newAccount, platform: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Handle / Username</Label>
                <Input 
                  placeholder="e.g. janes_creations" 
                  value={newAccount.handle}
                  onChange={(e) => setNewAccount({ ...newAccount, handle: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addAccountMutation.isPending} className="flex-1">
                  {addAccountMutation.isPending ? "Adding..." : "Add"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const platform = PLATFORMS.find(p => p.value === account.platform);
          const Icon = platform?.icon || Users;
          
          return (
            <Card key={account.id} className="overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${platform?.color}`} />
                    <span className="font-bold capitalize">{account.platform}</span>
                  </div>
                  <Badge variant={account.status === "active" ? "default" : "destructive"}>
                    {account.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{account.displayName || `@${account.handle}`}</p>
                    {account.displayName && <p className="text-sm text-muted-foreground">@{account.handle}</p>}
                  </div>
                  {account.profileUrl && (
                    <a href={account.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {account.lastScrapedAt ? format(new Date(account.lastScrapedAt), "MMM d, h:mm a") : "Never"}</span>
                  </div>
                  {account.lastError && (
                    <div className="flex items-start gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      <span>{account.lastError}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => refreshMutation.mutate(account.id)}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                    Update Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to disconnect this account?")) {
                        deleteAccountMutation.mutate(account.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {accounts.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border-2 border-dashed">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No social accounts connected</p>
            <p className="text-sm text-muted-foreground mt-1">Connect your Instagram, TikTok, or YouTube to track analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}

