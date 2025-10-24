import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimpleUploader } from "@/components/SimpleUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Sparkles, Users, Image as ImageIcon, Video, CheckCircle2 } from "lucide-react";

interface SecondMeRequest {
  id: string;
  clientId: number;
  clientName: string;
  characterName?: string;
  photoUrls: string[];
  status: string;
  setupPaid: boolean;
  weeklySubscriptionActive: boolean;
  createdAt: string;
  vibe?: string;
  mission?: string;
  bio?: string;
}

export default function AdminSecondMeUpload() {
  const [selectedClient, setSelectedClient] = useState<SecondMeRequest | null>(null);
  const [contentType, setContentType] = useState<"image" | "video">("image");
  const [contentUrl, setContentUrl] = useState("");
  const [caption, setCaption] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<SecondMeRequest[]>({
    queryKey: ["/api/admin/second-me/requests"],
  });

  const uploadContentMutation = useMutation({
    mutationFn: async (data: { clientId: number; contentType: string; mediaUrl: string; caption: string }) => {
      const response = await apiRequest("POST", "/api/admin/second-me/content", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/second-me/content"] });
      toast({
        title: "✅ Content Uploaded!",
        description: "AI content has been added to the client's gallery.",
      });
      setContentUrl("");
      setCaption("");
      setSelectedClient(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedClient || !contentUrl) {
      toast({
        title: "Missing Information",
        description: "Please select a client and upload content.",
        variant: "destructive",
      });
      return;
    }

    uploadContentMutation.mutate({
      clientId: selectedClient.clientId,
      contentType,
      mediaUrl: contentUrl,
      caption: caption || `AI Generated ${contentType === "image" ? "Image" : "Video"}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Second Me clients...</p>
        </div>
      </div>
    );
  }

  const activeClients = requests.filter(r => r.setupPaid && r.weeklySubscriptionActive);
  const pendingClients = requests.filter(r => !r.setupPaid || !r.weeklySubscriptionActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Second Me - Content Upload
          </h1>
          <p className="text-muted-foreground">Upload AI-generated content for your clients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Selection */}
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle>Active Clients</CardTitle>
                  <CardDescription>{activeClients.length} clients with Second Me</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {activeClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedClient?.id === client.id
                          ? "border-purple-500 bg-purple-50/50"
                          : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={client.photoUrls[0]} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {client.characterName?.[0] || client.clientName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{client.characterName || client.clientName}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{client.bio || client.mission || "No bio available"}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {client.vibe && (
                              <Badge variant="secondary" className="text-xs capitalize">{client.vibe}</Badge>
                            )}
                            {client.weeklySubscriptionActive && (
                              <Badge className="bg-green-500/20 text-green-700 text-xs">Active</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeClients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No active Second Me clients yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Content Upload Form */}
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-pink-500/10">
                  <Upload className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle>Upload AI Content</CardTitle>
                  <CardDescription>
                    {selectedClient
                      ? `Uploading for ${selectedClient.characterName || selectedClient.clientName}`
                      : "Select a client first"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedClient ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Select a client from the list to start uploading content</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select value={contentType} onValueChange={(value: "image" | "video") => setContentType(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            <span>Image</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            <span>Video</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="upload">Upload Content</Label>
                    <div className="mt-2">
                      {contentUrl ? (
                        <div className="relative">
                          {contentType === "image" ? (
                            <img src={contentUrl} alt="Preview" className="w-full rounded-lg" />
                          ) : (
                            <video src={contentUrl} controls className="w-full rounded-lg" />
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setContentUrl("")}
                            className="absolute top-2 right-2"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <SimpleUploader onUploadComplete={(url) => setContentUrl(url)} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="caption">Caption / Description</Label>
                    <Textarea
                      id="caption"
                      placeholder="Add a caption or description for this content..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!contentUrl || uploadContentMutation.isPending}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {uploadContentMutation.isPending ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Upload to Client Gallery
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Clients */}
        {pendingClients.length > 0 && (
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Pending Setup</CardTitle>
              <CardDescription>{pendingClients.length} clients waiting for setup completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingClients.map((client) => (
                  <div key={client.id} className="p-4 rounded-lg border border-orange-200 bg-orange-50/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={client.photoUrls[0]} />
                        <AvatarFallback>{client.clientName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-sm">{client.characterName || client.clientName}</h4>
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{client.photoUrls.length} photos uploaded</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

