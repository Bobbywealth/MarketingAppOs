import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Instagram, Facebook, Twitter, Linkedin, ChevronLeft, ChevronRight, Grid3x3, List, CheckCircle2, Clock, XCircle, Upload, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SimpleUploader } from "@/components/SimpleUploader";

interface ContentPost {
  id: string;
  platform: string;
  caption: string;
  mediaUrl?: string;
  scheduledFor: string;
  approvalStatus: string;
  approvedBy?: string;
  publishedAt?: string;
  createdAt: string;
}

export default function ClientContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    platform: "",
    caption: "",
    mediaUrl: "",
    scheduledFor: "",
    scheduledTime: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contentPosts = [], isLoading } = useQuery<ContentPost[]>({
    queryKey: ["/api/content-posts"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/content-posts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-posts"] });
      toast({
        title: "Content Uploaded!",
        description: "Your content has been submitted for approval.",
      });
      setUploadDialogOpen(false);
      setUploadForm({
        platform: "",
        caption: "",
        mediaUrl: "",
        scheduledFor: "",
        scheduledTime: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUploadSubmit = () => {
    if (!uploadForm.platform || !uploadForm.caption) {
      toast({
        title: "Missing Fields",
        description: "Please select a platform and add a caption.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = uploadForm.scheduledFor && uploadForm.scheduledTime
      ? `${uploadForm.scheduledFor}T${uploadForm.scheduledTime}:00Z`
      : null;

    createPostMutation.mutate({
      platform: uploadForm.platform,
      caption: uploadForm.caption,
      mediaUrl: uploadForm.mediaUrl || null,
      scheduledFor: scheduledDateTime,
      approvalStatus: "pending", // Client-uploaded content starts as pending
    });
  };

  const getPlatformIcon = (platform: string) => {
    const iconMap: Record<string, any> = {
      instagram: Instagram,
      facebook: Facebook,
      twitter: Twitter,
      linkedin: Linkedin,
    };
    return iconMap[platform.toLowerCase()] || CalendarIcon;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; className: string; icon: any }> = {
      draft: { variant: "secondary", className: "bg-gray-500/10 text-gray-600", icon: Clock },
      pending: { variant: "secondary", className: "bg-orange-500/10 text-orange-600", icon: Clock },
      approved: { variant: "secondary", className: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
      published: { variant: "secondary", className: "bg-blue-500/10 text-blue-600", icon: CheckCircle2 },
      rejected: { variant: "destructive", className: "bg-red-500/10 text-red-600", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Calendar view logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPostsForDay = (day: Date) => {
    return contentPosts.filter(post => 
      post.scheduledFor && isSameDay(new Date(post.scheduledFor), day)
    );
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Content Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View your scheduled content and upload your own
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Content
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Content ({contentPosts.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({contentPosts.filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'draft').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({contentPosts.filter(p => p.approvalStatus === 'approved' || p.approvalStatus === 'published').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {viewMode === "calendar" ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-2xl font-bold">
                  {format(currentDate, "MMMM yyyy")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-center font-semibold text-sm py-2 text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {calendarDays.map((day, idx) => {
                    const postsForDay = getPostsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div
                        key={idx}
                        className={`min-h-[100px] border rounded-lg p-2 ${
                          isCurrentMonth ? "bg-background" : "bg-muted/30"
                        } ${isToday ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? "text-primary" : isCurrentMonth ? "" : "text-muted-foreground"
                        }`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {postsForDay.slice(0, 2).map(post => {
                            const Icon = getPlatformIcon(post.platform);
                            return (
                              <div
                                key={post.id}
                                className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer truncate flex items-center gap-1"
                                onClick={() => setSelectedPost(post)}
                              >
                                <Icon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{post.caption || "Untitled"}</span>
                              </div>
                            );
                          })}
                          {postsForDay.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{postsForDay.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading content...</p>
                </div>
              ) : contentPosts.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-semibold">No content yet</p>
                    <p className="text-sm mt-2">Content created for you will appear here</p>
                  </div>
                </Card>
              ) : (
                contentPosts
                  .sort((a, b) => new Date(b.scheduledFor || b.createdAt).getTime() - new Date(a.scheduledFor || a.createdAt).getTime())
                  .map(post => {
                    const Icon = getPlatformIcon(post.platform);
                    return (
                      <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{post.caption || "Untitled Post"}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="secondary">{post.platform}</Badge>
                                  {getStatusBadge(post.approvalStatus)}
                                  {post.scheduledFor && (
                                    <span className="text-xs text-muted-foreground">
                                      📅 {format(new Date(post.scheduledFor), "MMM d, yyyy 'at' h:mm a")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {post.mediaUrl && (
                              <img 
                                src={post.mediaUrl} 
                                alt="Post preview" 
                                className="w-16 h-16 rounded object-cover"
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid gap-4">
            {contentPosts
              .filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'draft')
              .map(post => {
                const Icon = getPlatformIcon(post.platform);
                return (
                  <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-orange-500/10">
                            <Icon className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{post.caption || "Untitled Post"}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{post.platform}</Badge>
                              {getStatusBadge(post.approvalStatus)}
                              {post.scheduledFor && (
                                <span className="text-xs text-muted-foreground">
                                  📅 {format(new Date(post.scheduledFor), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {post.mediaUrl && (
                          <img src={post.mediaUrl} alt="Post preview" className="w-16 h-16 rounded object-cover" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="grid gap-4">
            {contentPosts
              .filter(p => p.approvalStatus === 'approved' || p.approvalStatus === 'published')
              .map(post => {
                const Icon = getPlatformIcon(post.platform);
                return (
                  <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{post.caption || "Untitled Post"}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{post.platform}</Badge>
                              {getStatusBadge(post.approvalStatus)}
                              {post.scheduledFor && (
                                <span className="text-xs text-muted-foreground">
                                  📅 {format(new Date(post.scheduledFor), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {post.mediaUrl && (
                          <img src={post.mediaUrl} alt="Post preview" className="w-16 h-16 rounded object-cover" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
            <DialogDescription>
              View the details of this scheduled content
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              {selectedPost.mediaUrl && (
                <img 
                  src={selectedPost.mediaUrl} 
                  alt="Post preview" 
                  className="w-full rounded-lg object-cover max-h-96"
                />
              )}
              <div>
                <h4 className="font-semibold mb-2">Caption</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedPost.caption || "No caption"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Platform</h4>
                  <Badge variant="secondary">{selectedPost.platform}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  {getStatusBadge(selectedPost.approvalStatus)}
                </div>
                {selectedPost.scheduledFor && (
                  <div>
                    <h4 className="font-semibold mb-2">Scheduled For</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedPost.scheduledFor), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}
                {selectedPost.publishedAt && (
                  <div>
                    <h4 className="font-semibold mb-2">Published At</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedPost.publishedAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Content Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Your Content</DialogTitle>
            <DialogDescription>
              Upload photos or videos from your photographer. We'll review and schedule them for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={uploadForm.platform}
                onValueChange={(value) => setUploadForm({ ...uploadForm, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="caption">Caption *</Label>
              <Textarea
                id="caption"
                placeholder="Write your caption here..."
                value={uploadForm.caption}
                onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label>Upload Media (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload photos or videos for this post
              </p>
              <SimpleUploader
                onUploadComplete={(url) => setUploadForm({ ...uploadForm, mediaUrl: url })}
              />
              {uploadForm.mediaUrl && (
                <div className="mt-2">
                  <img 
                    src={uploadForm.mediaUrl} 
                    alt="Uploaded content" 
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled-date">Preferred Date (Optional)</Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={uploadForm.scheduledFor}
                  onChange={(e) => setUploadForm({ ...uploadForm, scheduledFor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="scheduled-time">Preferred Time (Optional)</Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={uploadForm.scheduledTime}
                  onChange={(e) => setUploadForm({ ...uploadForm, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
                disabled={createPostMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

