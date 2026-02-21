import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type ApiKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type CreatedApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  apiKey: string;
  warning: string;
};

const EXPIRY_OPTIONS = [
  { label: "Never", value: "never" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "180 days", value: "180" },
  { label: "365 days", value: "365" },
] as const;

function formatDate(date: string | null) {
  if (!date) return "Never";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

export function ApiKeysPanel() {
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [expiry, setExpiry] = useState<(typeof EXPIRY_OPTIONS)[number]["value"]>("90");
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);

  const { data: apiKeys = [], isLoading, isFetching } = useQuery<ApiKeyRecord[]>({
    queryKey: ["/api/api-keys"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/api-keys");
      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }
      return response.json();
    },
  });

  const activeKeys = useMemo(() => apiKeys.filter((key) => !key.revokedAt), [apiKeys]);

  const createApiKeyMutation = useMutation({
    mutationFn: async () => {
      const expiresInDays = expiry === "never" ? undefined : Number(expiry);
      const response = await apiRequest("POST", "/api/api-keys", {
        name: newKeyName.trim(),
        expiresInDays,
        scopes: ["api:full"],
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create API key");
      }

      return response.json() as Promise<CreatedApiKey>;
    },
    onSuccess: (result) => {
      setCreatedKey(result);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API key created",
        description: "Copy it now. You will not be able to view it again.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/api-keys/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke API key");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: "API key revoked", description: "The key can no longer be used." });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to revoke key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({
        title: "Clipboard unavailable",
        description: `Copy ${label} manually from the field.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          API Keys
        </CardTitle>
        <CardDescription>Create, copy, and revoke keys used to access your API.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="font-medium">Create a new key</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <div className="space-y-1">
              <Label htmlFor="api-key-name">Key name</Label>
              <Input
                id="api-key-name"
                placeholder="e.g. Zapier Integration"
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Expires in</Label>
              <Select value={expiry} onValueChange={(value: (typeof EXPIRY_OPTIONS)[number]["value"]) => setExpiry(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="self-end">
              <Button
                onClick={() => createApiKeyMutation.mutate()}
                disabled={createApiKeyMutation.isPending || newKeyName.trim().length < 3}
              >
                {createApiKeyMutation.isPending ? "Creating..." : "Create key"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Key names must be at least 3 characters. Keys are hashed at rest and only shown once.</p>
        </div>

        {createdKey && (
          <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-amber-700 dark:text-amber-300">New key created</p>
              <Badge variant="secondary">Copy now</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{createdKey.warning}</p>
            <div className="flex gap-2">
              <Input value={createdKey.apiKey} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={() => handleCopy(createdKey.apiKey, "API key")}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Existing keys</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] })}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading API keys...</p>
          ) : activeKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active keys yet.</p>
          ) : (
            <div className="space-y-2">
              {activeKeys.map((key) => (
                <div key={key.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeApiKeyMutation.mutate(key.id)}
                      disabled={revokeApiKeyMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                    <p>Created: {formatDate(key.createdAt)}</p>
                    <p>Last used: {formatDate(key.lastUsedAt)}</p>
                    <p>Expires: {formatDate(key.expiresAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
