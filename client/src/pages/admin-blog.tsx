import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Edit, ExternalLink, Eye, PenTool } from "lucide-react";
import { SimpleUploader } from "@/components/SimpleUploader";
import ReactMarkdown from "react-markdown";

type BlogStatus = "draft" | "published" | "archived";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  readTime: string | null;
  featured: boolean | null;
  imageUrl: string | null;
  status: BlogStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function formatDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminBlog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    status: "draft" as BlogStatus,
    author: "",
    category: "",
    tagsCsv: "",
    readTime: "",
    featured: false,
    publishedAt: "",
    excerpt: "",
    content: "",
  });

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog-posts"],
  });

  // Handle ?edit=ID query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId && posts.length > 0 && !editing) {
      const post = posts.find(p => p.id === editId);
      if (post) {
        onOpenEdit(post);
        // Clear the param without refreshing
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [posts, editing]);

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      const ad = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bd = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [posts]);

  const resetForm = () => {
    setEditing(null);
    setImageUrl("");
    setForm({
      title: "",
      slug: "",
      status: "draft",
      author: "",
      category: "",
      tagsCsv: "",
      readTime: "",
      featured: false,
      publishedAt: "",
      excerpt: "",
      content: "",
    });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/admin/blog-posts", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "✅ Blog post created" });
    },
    onError: (err: any) => {
      toast({
        title: "❌ Error creating blog post",
        description: err?.message || "Failed to create blog post",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/blog-posts/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "✅ Blog post updated" });
    },
    onError: (err: any) => {
      toast({
        title: "❌ Error updating blog post",
        description: err?.message || "Failed to update blog post",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/blog-posts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      toast({ title: "✅ Blog post deleted" });
    },
    onError: (err: any) => {
      toast({
        title: "❌ Error deleting blog post",
        description: err?.message || "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  const onOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const onOpenEdit = (p: BlogPost) => {
    setEditing(p);
    setImageUrl(p.imageUrl || "");
    setForm({
      title: p.title || "",
      slug: p.slug || "",
      status: p.status || "draft",
      author: p.author || "",
      category: p.category || "",
      tagsCsv: (p.tags || []).join(", "),
      readTime: p.readTime || "",
      featured: Boolean(p.featured),
      publishedAt: formatDatetimeLocal(p.publishedAt),
      excerpt: p.excerpt || "",
      content: p.content || "",
    });
    setDialogOpen(true);
  };

  const buildPayload = () => {
    const tags = form.tagsCsv
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      status: form.status,
      author: form.author.trim() || null,
      category: form.category.trim() || null,
      tags,
      readTime: form.readTime.trim() || null,
      featured: Boolean(form.featured),
      imageUrl: imageUrl.trim() || null,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
    };
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "❌ Title is required", variant: "destructive" });
      return;
    }
    if (!form.content.trim()) {
      toast({ title: "❌ Content is required", variant: "destructive" });
      return;
    }

    const payload = buildPayload();

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and publish posts for the public /blog page</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="lg" onClick={onOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update and publish changes" : "Draft first, then publish when ready"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Post title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (optional)</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="my-post-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate from title.</p>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as BlogStatus }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={form.author}
                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                    placeholder="Marketing Team"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="SEO"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={form.tagsCsv}
                    onChange={(e) => setForm((f) => ({ ...f, tagsCsv: e.target.value }))}
                    placeholder="social media, conversion, ROI"
                  />
                </div>

                <div>
                  <Label htmlFor="readTime">Read time</Label>
                  <Input
                    id="readTime"
                    value={form.readTime}
                    onChange={(e) => setForm((f) => ({ ...f, readTime: e.target.value }))}
                    placeholder="8 min read"
                  />
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    <Label>Featured</Label>
                    <p className="text-xs text-muted-foreground">Featured posts show at the top of the blog</p>
                  </div>
                  <Switch checked={form.featured} onCheckedChange={(checked) => setForm((f) => ({ ...f, featured: checked }))} />
                </div>

                <div>
                  <Label htmlFor="publishedAt">Published at</Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Hero image (optional)</Label>
                  {imageUrl && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border mb-2 group">
                      <img 
                        src={imageUrl} 
                        alt="Hero preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setImageUrl("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... or /uploads/..."
                    />
                    <SimpleUploader
                      accept="image/*"
                      maxSizeMB={10}
                      buttonText="Upload Image"
                      onUploadComplete={(url) => setImageUrl(url)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    rows={3}
                    placeholder="Short summary shown in the blog list…"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content">Content *</Label>
                    <span className="text-xs text-muted-foreground">Markdown supported</span>
                  </div>
                  <Tabs defaultValue="edit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                      <TabsTrigger value="edit" className="flex items-center gap-2">
                        <PenTool className="w-4 h-4" />
                        Edit
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                      <Textarea
                        id="content"
                        value={form.content}
                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                        rows={14}
                        placeholder="Write the blog post content (markdown/plaintext)."
                        required
                        className="font-mono text-sm"
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <div className="border rounded-md p-4 bg-white dark:bg-zinc-950 min-h-[350px] max-h-[500px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                        {form.content ? (
                          <ReactMarkdown>{form.content}</ReactMarkdown>
                        ) : (
                          <p className="text-muted-foreground italic text-center py-20">Nothing to preview yet.</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing
                    ? updateMutation.isPending
                      ? "Saving…"
                      : "Save Changes"
                    : createMutation.isPending
                      ? "Creating…"
                      : "Create Post"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>Drafts are only visible in admin. Published posts show on `/blog`.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No blog posts yet. Create your first one!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => (
                  <TableRow 
                    key={p.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onOpenEdit(p)}
                  >
                    <TableCell>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.category ? `${p.category} • ` : ""}
                        {p.author || "—"}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Badge variant={p.status === "published" ? "default" : p.status === "archived" ? "secondary" : "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{p.slug}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>{p.featured ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/blog?post=${encodeURIComponent(p.slug)}`, "_blank")}
                          title="Open on public blog"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onOpenEdit(p)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete blog post "${p.title}"? This cannot be undone.`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

