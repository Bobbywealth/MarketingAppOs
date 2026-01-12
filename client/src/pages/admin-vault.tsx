import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Eye, EyeOff, Lock, Plus, Trash2, Unlock } from "lucide-react";

type VaultStatus = {
  unlocked: boolean;
  unlockedUntil: number | null;
};

type VaultItem = {
  id: string;
  name: string;
  username: string | null;
  url: string | null;
  password: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number | null;
};

async function readJsonOrText(res: Response): Promise<{ message?: string }> {
  try {
    return await res.json();
  } catch {
    try {
      const text = await res.text();
      return { message: text };
    } catch {
      return {};
    }
  }
}

export default function AdminVaultPage() {
  const { toast } = useToast();

  const [vaultPassword, setVaultPassword] = useState("");
  const [search, setSearch] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<VaultItem | null>(null);

  const statusQuery = useQuery<VaultStatus>({
    queryKey: ["/api/vault/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vault/status");
      if (!res.ok) {
        const err = await readJsonOrText(res);
        throw new Error(err.message || "Failed to load vault status");
      }
      return res.json();
    },
  });

  const unlocked = !!statusQuery.data?.unlocked;

  const itemsQuery = useQuery<VaultItem[]>({
    queryKey: ["/api/vault/items"],
    enabled: unlocked,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vault/items");
      if (!res.ok) {
        const err = await readJsonOrText(res);
        throw new Error(err.message || "Failed to load vault items");
      }
      return res.json();
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/vault/unlock", { password: vaultPassword });
      if (!res.ok) {
        const err = await readJsonOrText(res);
        throw new Error(err.message || "Unlock failed");
      }
      return res.json();
    },
    onSuccess: async () => {
      setVaultPassword("");
      await statusQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/vault/items"] });
      toast({ title: "Vault unlocked" });
    },
    onError: (e: any) => {
      toast({ title: "Unlock failed", description: e?.message || "Unknown error", variant: "destructive" });
    },
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/vault/lock", {});
      if (!res.ok) {
        const err = await readJsonOrText(res);
        throw new Error(err.message || "Lock failed");
      }
      return res.json();
    },
    onSuccess: async () => {
      await statusQuery.refetch();
      queryClient.removeQueries({ queryKey: ["/api/vault/items"] });
      toast({ title: "Vault locked" });
    },
    onError: (e: any) => {
      toast({ title: "Lock failed", description: e?.message || "Unknown error", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; username?: string | null; url?: string | null; password: string; notes?: string | null }) => {
      const res = await apiRequest("POST", "/api/vault/items", payload);
      if (!res.ok) {
        const err = await readJsonOrText(res);
        throw new Error(err.message || "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/vault/items"] });
      toast({ title: "Saved" });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message || "Unknown error", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<VaultItem> }) => {
      const res = await apiRequest("PATCH", `/api/vault/items/${payload.id}`, payload.data);
      if (!res.ok) {
        const err = await readJsonOrText(res);
        throw new Error(err.message || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ["/api/vault/items"] });
      toast({ title: "Updated" });
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e?.message || "Unknown error", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/vault/items/${id}`, {});
      if (!res.ok) {
        const err = await readJsonOrText(res);
        throw new Error(err.message || "Delete failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vault/items"] });
      toast({ title: "Deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e?.message || "Unknown error", variant: "destructive" });
    },
  });

  const filteredItems = useMemo(() => {
    const items = itemsQuery.data || [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      return (
        i.name.toLowerCase().includes(q) ||
        (i.username || "").toLowerCase().includes(q) ||
        (i.url || "").toLowerCase().includes(q) ||
        (i.notes || "").toLowerCase().includes(q)
      );
    });
  }, [itemsQuery.data, search]);

  const unlockUntilText = useMemo(() => {
    const until = statusQuery.data?.unlockedUntil;
    if (!until) return null;
    try {
      return new Date(until).toLocaleString();
    } catch {
      return null;
    }
  }, [statusQuery.data?.unlockedUntil]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Password Vault</h1>
          <p className="text-muted-foreground">
            Admin-only. Entries are encrypted in the database. Unlock required to view/edit.
          </p>
          {unlocked && unlockUntilText && (
            <p className="text-xs text-muted-foreground mt-1">Unlocked until: {unlockUntilText}</p>
          )}
        </div>

        {unlocked ? (
          <Button variant="outline" onClick={() => lockMutation.mutate()} disabled={lockMutation.isPending}>
            <Lock className="w-4 h-4 mr-2" />
            {lockMutation.isPending ? "Locking…" : "Lock"}
          </Button>
        ) : null}
      </div>

      {!unlocked && (
        <Card>
          <CardHeader>
            <CardTitle>Unlock Vault</CardTitle>
            <CardDescription>Enter the vault password (separate from your login).</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4 max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                unlockMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="vaultPassword">Vault Password</Label>
                <Input
                  id="vaultPassword"
                  type="password"
                  value={vaultPassword}
                  onChange={(e) => setVaultPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter vault password"
                />
              </div>
              <Button type="submit" disabled={unlockMutation.isPending || !vaultPassword.trim()}>
                <Unlock className="w-4 h-4 mr-2" />
                {unlockMutation.isPending ? "Unlocking…" : "Unlock"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {unlocked && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Entries</CardTitle>
                <CardDescription>Use this for internal credentials. Treat it like production secrets.</CardDescription>
              </div>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Vault Entry</DialogTitle>
                    <DialogDescription>Add a new credential.</DialogDescription>
                  </DialogHeader>
                  <VaultItemForm
                    submitLabel={createMutation.isPending ? "Saving…" : "Save"}
                    disabled={createMutation.isPending}
                    onSubmit={(data) => createMutation.mutate(data)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Input
                placeholder="Search name, username, URL, notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
              <Button
                variant="outline"
                onClick={() => {
                  statusQuery.refetch();
                  queryClient.invalidateQueries({ queryKey: ["/api/vault/items"] });
                }}
              >
                Refresh
              </Button>
            </div>

            {itemsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : itemsQuery.isError ? (
              <div className="text-sm text-destructive">{(itemsQuery.error as any)?.message || "Failed to load"}</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Name</TableHead>
                      <TableHead className="w-[180px]">Username</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="w-[300px]">Password</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                          No entries
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        const isRevealed = !!revealed[item.id];
                        const shortNotes = (item.notes || "").trim();
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.username || "—"}</TableCell>
                            <TableCell>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline underline-offset-2"
                                >
                                  {item.url}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={item.password || ""}
                                  readOnly
                                  type={isRevealed ? "text" : "password"}
                                  className="h-9"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(item.password || "");
                                      toast({ title: "Copied" });
                                    } catch {
                                      toast({ title: "Copy failed", variant: "destructive" });
                                    }
                                  }}
                                  aria-label="Copy password"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setRevealed((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                                  }
                                  aria-label={isRevealed ? "Hide password" : "Reveal password"}
                                >
                                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {shortNotes ? (shortNotes.length > 120 ? `${shortNotes.slice(0, 120)}…` : shortNotes) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditItem(item)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id);
                                  }}
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vault Entry</DialogTitle>
            <DialogDescription>Update details (leave password blank to keep current).</DialogDescription>
          </DialogHeader>
          {editItem && (
            <VaultItemForm
              initial={{
                name: editItem.name,
                username: editItem.username || "",
                url: editItem.url || "",
                password: "",
                notes: editItem.notes || "",
              }}
              submitLabel={updateMutation.isPending ? "Saving…" : "Save"}
              disabled={updateMutation.isPending}
              passwordOptional
              onSubmit={(data) => {
                const payload: any = {
                  name: data.name,
                  username: data.username || null,
                  url: data.url || null,
                  notes: data.notes || null,
                };
                if (data.password) payload.password = data.password;
                updateMutation.mutate({ id: editItem.id, data: payload });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VaultItemForm(props: {
  initial?: { name: string; username: string; url: string; password: string; notes: string };
  submitLabel: string;
  disabled?: boolean;
  passwordOptional?: boolean;
  onSubmit: (data: { name: string; username: string; url: string; password: string; notes: string }) => void;
}) {
  const [name, setName] = useState(props.initial?.name ?? "");
  const [username, setUsername] = useState(props.initial?.username ?? "");
  const [url, setUrl] = useState(props.initial?.url ?? "");
  const [password, setPassword] = useState(props.initial?.password ?? "");
  const [notes, setNotes] = useState(props.initial?.notes ?? "");

  const canSubmit = name.trim().length > 0 && (props.passwordOptional ? true : password.trim().length > 0);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        props.onSubmit({
          name: name.trim(),
          username: username.trim(),
          url: url.trim(),
          password,
          notes,
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="vault-name">Name *</Label>
        <Input id="vault-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meta Business Suite" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vault-username">Username</Label>
        <Input id="vault-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="email / username" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vault-url">URL</Label>
        <Input id="vault-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vault-password">{props.passwordOptional ? "Password (optional)" : "Password *"}</Label>
        <Input
          id="vault-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={props.passwordOptional ? "Leave blank to keep current" : "Enter password"}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vault-notes">Notes</Label>
        <Textarea id="vault-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="2FA notes, recovery codes, etc." rows={5} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={props.disabled || !canSubmit}>
          {props.submitLabel}
        </Button>
      </div>
    </form>
  );
}

