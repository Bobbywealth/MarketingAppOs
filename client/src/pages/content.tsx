import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Calendar, Image } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ContentPost, Client } from "@shared/schema";

export default function Content() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<ContentPost[]>({
    queryKey: ["/api/content-posts"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/content-posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-posts"] });
      setDialogOpen(false);
      toast({ title: "Content post created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create post", variant: "destructive" });
    },
  });

  const updateApprovalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/content-posts/${id}/approval`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-posts"] });
      toast({ title: "Approval status updated" });
    },
  });

  const handleCreatePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createPostMutation.mutate({
      clientId: formData.get("clientId"),
      platform: formData.get("platform"),
      caption: formData.get("caption"),
      scheduledFor: formData.get("scheduledFor") ? new Date(formData.get("scheduledFor") as string) : null,
    });
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "approved": return "from-emerald-500 to-teal-500";
      case "pending": return "from-amber-500 to-orange-500";
      case "rejected": return "from-red-500 to-pink-500";
      case "published": return "from-purple-500 to-indigo-500";
      case "draft": return "from-slate-400 to-slate-500";
      default: return "from-slate-400 to-slate-500";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook": return "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20";
      case "instagram": return "bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/20";
      case "twitter": return "bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/20";
      case "linkedin": return "bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="p-6 lg:p-8 xl:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 border-0 shadow-lg">
                <div className="space-y-3">
                  <div className="h-4 bg-muted/50 rounded w-3/4 shimmer"></div>
                  <div className="h-20 bg-muted/50 rounded shimmer"></div>
                  <div className="h-4 bg-muted/50 rounded w-1/2 shimmer"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Content Calendar</h1>
            <p className="text-lg text-muted-foreground">Schedule and manage social media content</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-post">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create Content Post</DialogTitle>
              <DialogDescription>Schedule a new social media post for your client</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select name="clientId" required>
                    <SelectTrigger data-testid="select-post-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform *</Label>
                  <Select name="platform" required>
                    <SelectTrigger data-testid="select-platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption *</Label>
                  <Textarea id="caption" name="caption" rows={4} required data-testid="input-caption" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledFor">Schedule For</Label>
                  <Input id="scheduledFor" name="scheduledFor" type="datetime-local" data-testid="input-scheduled-for" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPostMutation.isPending} data-testid="button-submit-post">
                  {createPostMutation.isPending ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post) => (
          <Card key={post.id} className="hover-elevate transition-shadow" data-testid={`card-post-${post.id}`}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Badge className={`${getPlatformColor(post.platform)} border`} variant="outline">
                  {post.platform}
                </Badge>
                <Badge className={getStatusColor(post.approvalStatus)} variant="secondary">
                  {post.approvalStatus}
                </Badge>
              </div>

              <p className="text-sm line-clamp-4">{post.caption}</p>

              {post.scheduledFor && (
                <p className="text-xs text-muted-foreground">
                  Scheduled: {new Date(post.scheduledFor).toLocaleString()}
                </p>
              )}

              {post.approvalStatus === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => updateApprovalMutation.mutate({ id: post.id, status: "approved" })}
                    data-testid={`button-approve-${post.id}`}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => updateApprovalMutation.mutate({ id: post.id, status: "rejected" })}
                    data-testid={`button-reject-${post.id}`}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {posts?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No content posts yet</p>
        </div>
      )}
      </div>
    </div>
  );
}
