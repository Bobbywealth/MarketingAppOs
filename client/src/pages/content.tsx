import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Calendar, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ContentPost, Client, InsertContentPost } from "@shared/schema";
import { insertContentPostSchema } from "@shared/schema";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addWeeks, subWeeks, startOfDay, startOfMonth, endOfMonth, addMonths, subMonths, addDays, subDays, isSameMonth } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SimpleUploader } from "@/components/SimpleUploader";

type ViewType = "day" | "week" | "month";

// Form schema extending the insert schema
const formSchema = insertContentPostSchema.extend({
  scheduledFor: z.string().optional(),
}).omit({
  approvalStatus: true,
  approvedBy: true,
  publishedAt: true,
});

type FormValues = z.infer<typeof formSchema>;

export default function Content() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [draggedPost, setDraggedPost] = useState<ContentPost | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      platforms: [],
      caption: "",
      scheduledFor: "",
    },
  });

  const { data: posts, isLoading } = useQuery<ContentPost[]>({
    queryKey: ["/api/content-posts"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: InsertContentPost) => {
      return await apiRequest("POST", "/api/content-posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-posts"] });
      setDialogOpen(false);
      form.reset();
      setUploadedMediaUrl(null);
      toast({ title: "Content post created successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create post";
      toast({ title: errorMessage, variant: "destructive" });
    },
  });

  const updateApprovalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/content-posts/${id}/approval`, { approvalStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-posts"] });
      toast({ title: "Approval status updated" });
    },
  });

  const updatePostDateMutation = useMutation({
    mutationFn: async ({ id, scheduledFor }: { id: string; scheduledFor: Date }) => {
      return await apiRequest("PATCH", `/api/content-posts/${id}`, { scheduledFor: scheduledFor.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-posts"] });
      setDraggedPost(null);
      toast({ title: "Post rescheduled successfully" });
    },
    onError: () => {
      setDraggedPost(null);
      toast({ title: "Failed to reschedule post", variant: "destructive" });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (post: ContentPost) => {
    setDraggedPost(post);
  };

  const handleDragOver = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (!draggedPost) return;
    
    // Set the time to the same time as the original post, just change the date
    const newDate = new Date(day);
    if (draggedPost.scheduledFor) {
      const originalDate = new Date(draggedPost.scheduledFor);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());
    } else {
      newDate.setHours(9, 0, 0, 0); // Default to 9 AM if no time set
    }
    
    updatePostDateMutation.mutate({
      id: draggedPost.id,
      scheduledFor: newDate,
    });
  };

  const handleCreatePost = (values: FormValues) => {
    const postData: InsertContentPost = {
      clientId: values.clientId,
      platforms: values.platforms,
      caption: values.caption || "",
      scheduledFor: values.scheduledFor || null,
      mediaUrl: uploadedMediaUrl || values.mediaUrl || null,
    };

    createPostMutation.mutate(postData);
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
      case "tiktok": return "bg-black/10 text-black dark:text-white border-black/20";
      case "youtube": return "bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "pending": return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "rejected": return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "published": return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "draft": return "bg-slate-500/10 text-slate-700 dark:text-slate-400";
      default: return "bg-slate-500/10 text-slate-700 dark:text-slate-400";
    }
  };

  // Get days based on current view
  const viewDays = useMemo(() => {
    if (view === "day") {
      return [startOfDay(currentDate)];
    } else if (view === "week") {
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: weekEnd });
    } else {
      // month view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      // Include days from previous/next month to fill the grid
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  }, [view, currentDate]);

  // Get week days for calendar (legacy)
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Filter and organize posts by day
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (selectedClient === "all") return posts;
    return posts.filter(post => post.clientId === selectedClient);
  }, [posts, selectedClient]);

  // Navigation functions
  const handlePrevious = () => {
    if (view === "day") {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getViewTitle = () => {
    if (view === "day") {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (view === "week") {
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(currentDate, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const getPostsForDay = (day: Date) => {
    return filteredPosts.filter(post => {
      if (!post.scheduledFor) return false;
      return isSameDay(new Date(post.scheduledFor), day);
    });
  };

  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || "Unknown Client";
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
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-4 md:space-y-6 lg:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Content Calendar</h1>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Schedule and manage social media content for all clients</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-client">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) form.reset();
            }}>
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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreatePost)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-post-client">
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platforms"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Platforms *</FormLabel>
                            <p className="text-sm text-muted-foreground">Select platforms to post to</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { id: 'facebook', label: 'Facebook', icon: '📘' },
                              { id: 'instagram', label: 'Instagram', icon: '📷' },
                              { id: 'twitter', label: 'Twitter/X', icon: '🐦' },
                              { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
                              { id: 'tiktok', label: 'TikTok', icon: '🎵' },
                              { id: 'youtube', label: 'YouTube', icon: '▶️' },
                            ].map((platform) => (
                              <FormField
                                key={platform.id}
                                control={form.control}
                                name="platforms"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={platform.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={field.value?.includes(platform.id)}
                                          onChange={(e) => {
                                            return e.target.checked
                                              ? field.onChange([...(field.value || []), platform.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value: string) => value !== platform.id
                                                  )
                                                )
                                          }}
                                          className="h-4 w-4 rounded border-gray-300"
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {platform.icon} {platform.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Media Upload */}
                    <div className="space-y-2">
                      <Label>Media (Image or Video)</Label>
                      <div className="flex items-center gap-4">
                        <SimpleUploader
                          onUploadComplete={(url) => {
                            setUploadedMediaUrl(url);
                          }}
                          accept="image/*,video/*"
                          maxSizeMB={50}
                          buttonText={uploadedMediaUrl ? "Change Media" : "Upload Media"}
                        />
                      </div>
                      {uploadedMediaUrl && (
                        <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {uploadedMediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={uploadedMediaUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                          ) : uploadedMediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video src={uploadedMediaUrl} className="max-w-full max-h-full" controls />
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <ImageIcon className="w-6 h-6" />
                              <span className="text-sm">Media uploaded</span>
                            </div>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => setUploadedMediaUrl(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Upload an image or video for this post (max 50MB)</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="caption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caption *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} data-testid="input-caption" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduledFor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule For</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" data-testid="input-scheduled-for" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPostMutation.isPending} data-testid="button-submit-post">
                        {createPostMutation.isPending ? "Creating..." : "Create Post"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Switcher & Navigation */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* View Switcher */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              size="sm"
              variant={view === "day" ? "default" : "ghost"}
              onClick={() => setView("day")}
              className="h-8"
            >
              Day
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "default" : "ghost"}
              onClick={() => setView("week")}
              className="h-8"
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={view === "month" ? "default" : "ghost"}
              onClick={() => setView("month")}
              className="h-8"
            >
              Month
            </Button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              data-testid="button-previous"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center" data-testid="text-date-range">
              {getViewTitle()}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              data-testid="button-next"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Today Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
              setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
            }}
          >
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className={`grid gap-4 ${
          view === "day" ? "grid-cols-1" : 
          view === "week" ? "grid-cols-1 md:grid-cols-7" : 
          "grid-cols-7"
        }`}>
          {viewDays.map((day) => {
            const dayPosts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = view === "month" ? isSameMonth(day, currentDate) : true;

            const isDragOver = dragOverDay && isSameDay(dragOverDay, day);

            return (
              <Card 
                key={day.toISOString()} 
                className={`${isToday ? 'ring-2 ring-primary' : ''} ${!isCurrentMonth && view === "month" ? 'opacity-40' : ''} ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''} transition-all`} 
                data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                      <p className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                    </div>
                    {dayPosts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayPosts.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2 min-h-[100px]">
                  {dayPosts.map((post) => (
                    <Card 
                      key={post.id} 
                      className={`hover-elevate border-0 bg-card/50 cursor-move ${draggedPost?.id === post.id ? 'opacity-50' : ''}`} 
                      data-testid={`card-post-${post.id}`}
                      draggable
                      onDragStart={() => handleDragStart(post)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(post.platforms) ? post.platforms : [post.platforms]).map((platform: string, idx: number) => (
                              <Badge key={idx} className={`${getPlatformColor(platform)} border text-[10px] px-1`} variant="outline">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                          <Badge className={`${getStatusColor(post.approvalStatus)} text-[10px] px-1`} variant="secondary">
                            {post.approvalStatus}
                          </Badge>
                        </div>
                        
                        {post.mediaUrl && (
                          <div className="relative w-full h-20 rounded border overflow-hidden bg-muted group">
                            {post.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                            ) : post.mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                              <video src={post.mediaUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`${post.mediaUrl}?download=true`, '_blank');
                              }}
                              title="Download media"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        
                        <p className="text-xs font-medium text-muted-foreground">{getClientName(post.clientId)}</p>
                        <p className="text-xs line-clamp-2">{post.caption}</p>
                        
                        {post.scheduledFor && (
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(post.scheduledFor), 'h:mm a')}
                          </p>
                        )}

                        {post.approvalStatus === "pending" && (
                          <div className="flex gap-1 pt-1">
                            <Button
                              size="sm"
                              className="flex-1 h-6 text-xs"
                              onClick={() => updateApprovalMutation.mutate({ id: post.id, status: "approved" })}
                              data-testid={`button-approve-${post.id}`}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 h-6 text-xs"
                              onClick={() => updateApprovalMutation.mutate({ id: post.id, status: "rejected" })}
                              data-testid={`button-reject-${post.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {dayPosts.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-4">No posts</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No content posts scheduled yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
