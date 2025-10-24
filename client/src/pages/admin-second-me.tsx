import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Upload, Check, X, Sparkles, Image as ImageIcon, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SimpleUploader } from "@/components/SimpleUploader";
import { useLocation } from "wouter";

interface SecondMeRequest {
  id: string;
  clientId: string;
  clientName: string;
  status: string;
  photoUrls: string[];
  avatarUrl?: string;
  setupPaid: boolean;
  weeklySubscriptionActive: boolean;
  notes?: string;
  createdAt: string;
}

export default function AdminSecondMePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<SecondMeRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [weeklyContentUrls, setWeeklyContentUrls] = useState<string[]>([]);

  const { data: requests = [], isLoading } = useQuery<SecondMeRequest[]>({
    queryKey: ["/api/admin/second-me/requests"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/second-me/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/second-me/requests"] });
      setIsDialogOpen(false);
      toast({
        title: "✅ Updated successfully!",
        description: "Second Me request has been updated.",
      });
    },
  });

  const uploadContentMutation = useMutation({
    mutationFn: async ({ secondMeId, content }: { secondMeId: string; content: any[] }) => {
      return await apiRequest("POST", "/api/admin/second-me/content", { secondMeId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/second-me/requests"] });
      setWeeklyContentUrls([]);
      toast({
        title: "✅ Content uploaded!",
        description: "Weekly AI content has been added for the client.",
      });
    },
  });

  const handleViewRequest = (request: SecondMeRequest) => {
    setSelectedRequest(request);
    setAvatarUrl(request.avatarUrl || "");
    setNotes(request.notes || "");
    setStatus(request.status);
    setIsDialogOpen(true);
  };

  const handleUpdateRequest = () => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      data: {
        status,
        avatarUrl: avatarUrl || undefined,
        notes: notes || undefined,
      },
    });
  };

  const handleUploadContent = (secondMeId: string) => {
    if (weeklyContentUrls.length === 0) {
      toast({
        title: "No content to upload",
        description: "Please upload at least one piece of content",
        variant: "destructive",
      });
      return;
    }

    const content = weeklyContentUrls.map((url, idx) => ({
      mediaUrl: url,
      contentType: url.includes("video") ? "video" : "image",
      caption: `AI-generated content ${idx + 1}`,
    }));

    uploadContentMutation.mutate({ secondMeId, content });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">⏳ Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700">🔄 Processing</Badge>;
      case "ready":
        return <Badge className="bg-green-500/10 text-green-700">✅ Ready</Badge>;
      case "active":
        return <Badge className="bg-primary/10 text-primary">🌟 Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 xl:p-12">
        <div className="space-y-4">
          <div className="h-8 bg-muted/50 rounded w-1/3 shimmer"></div>
          <div className="h-64 bg-muted/50 rounded shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 xl:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-primary" />
            Second Me Management
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Manage client AI avatar requests and weekly content delivery
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation("/admin-second-me/upload")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload AI Content for Clients
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-3xl font-bold">{requests.length}</p>
                </div>
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {requests.filter(r => r.status === "pending").length}
                  </p>
                </div>
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold text-green-600">
                    {requests.filter(r => r.status === "active").length}
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Subs</p>
                  <p className="text-3xl font-bold text-primary">
                    {requests.filter(r => r.weeklySubscriptionActive).length}
                  </p>
                </div>
                <Video className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Client Requests</CardTitle>
            <CardDescription>Manage Second Me avatar creation and content delivery</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No Second Me requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="hover-elevate transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                            {request.clientName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{request.clientName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {request.photoUrls.length} photos uploaded • 
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(request.status)}
                              {request.setupPaid && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 text-xs">
                                  💰 Setup Paid
                                </Badge>
                              )}
                              {request.weeklySubscriptionActive && (
                                <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                                  📅 Weekly Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleViewRequest(request)}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Management Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                {selectedRequest?.clientName} - Second Me
              </DialogTitle>
              <DialogDescription>
                Manage avatar creation and content delivery
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <Tabs defaultValue="photos" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="photos">Photos ({selectedRequest.photoUrls.length})</TabsTrigger>
                  <TabsTrigger value="avatar">Avatar Setup</TabsTrigger>
                  <TabsTrigger value="content">Weekly Content</TabsTrigger>
                </TabsList>

                {/* Photos Tab */}
                <TabsContent value="photos" className="space-y-4">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {selectedRequest.photoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="aspect-square object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(url, "_blank")}
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* Avatar Setup Tab */}
                <TabsContent value="avatar" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending Payment</SelectItem>
                          <SelectItem value="processing">Processing/Creating</SelectItem>
                          <SelectItem value="ready">Avatar Ready</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Avatar URL (from Higgsfield)</Label>
                      <Input
                        placeholder="https://..."
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Paste the URL of the created AI avatar/character
                      </p>
                    </div>

                    {avatarUrl && (
                      <div className="p-4 rounded-lg border bg-muted/20">
                        <p className="text-sm font-medium mb-2">Avatar Preview:</p>
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-32 h-32 rounded-full object-cover mx-auto"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Admin Notes</Label>
                      <Textarea
                        placeholder="Internal notes about this avatar..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateRequest}
                        disabled={updateRequestMutation.isPending}
                      >
                        {updateRequestMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Weekly Content Tab */}
                <TabsContent value="content" className="space-y-6">
                  {selectedRequest.weeklySubscriptionActive ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm font-medium">📅 Weekly Subscription Active - $24.99/week</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload 4 pieces of AI-generated content each week
                        </p>
                      </div>

                      <div>
                        <Label>Upload Weekly Content (Videos/Images)</Label>
                        <div className="mt-2 space-y-3">
                          <SimpleUploader
                            onUploadComplete={(url) => setWeeklyContentUrls([...weeklyContentUrls, url])}
                          />
                          
                          {weeklyContentUrls.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                              {weeklyContentUrls.map((url, idx) => (
                                <div key={idx} className="relative group">
                                  <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                                    {url.includes("video") ? (
                                      <Video className="w-8 h-8 text-muted-foreground" />
                                    ) : (
                                      <img src={url} alt={`Content ${idx + 1}`} className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setWeeklyContentUrls(weeklyContentUrls.filter((_, i) => i !== idx))}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            onClick={() => handleUploadContent(selectedRequest.id)}
                            disabled={weeklyContentUrls.length === 0 || uploadContentMutation.isPending}
                            className="w-full"
                          >
                            {uploadContentMutation.isPending ? "Uploading..." : `Upload ${weeklyContentUrls.length} Content Pieces`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Client hasn't subscribed to weekly content yet
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

