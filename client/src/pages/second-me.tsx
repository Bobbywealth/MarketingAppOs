import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Check, X, User, Video, Image as ImageIcon, Sparkles, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SimpleUploader } from "@/components/SimpleUploader";

interface SecondMeData {
  id: string;
  status: string;
  photoUrls: string[];
  avatarUrl?: string;
  setupPaid: boolean;
  weeklySubscriptionActive: boolean;
  createdAt: string;
}

export default function SecondMePage() {
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const { data: user } = useQuery({ queryKey: ["/api/user"] });
  const { data: secondMe, isLoading } = useQuery<SecondMeData>({
    queryKey: ["/api/second-me"],
    enabled: !!user,
  });

  const createSecondMeMutation = useMutation({
    mutationFn: async (photoUrls: string[]) => {
      return await apiRequest("POST", "/api/second-me", { photoUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/second-me"] });
      toast({
        title: "✅ Photos uploaded successfully!",
        description: "We'll start creating your AI avatar. You'll be notified when it's ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (url: string) => {
    setUploadedPhotos([...uploadedPhotos, url]);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const handleSubmitPhotos = () => {
    if (uploadedPhotos.length < 15) {
      toast({
        title: "Not enough photos",
        description: "Please upload at least 15 professional photos",
        variant: "destructive",
      });
      return;
    }
    createSecondMeMutation.mutate(uploadedPhotos);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">⏳ Pending Payment</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700">🔄 Creating Avatar</Badge>;
      case "ready":
        return <Badge className="bg-green-500/10 text-green-700">✅ Avatar Ready</Badge>;
      case "active":
        return <Badge className="bg-primary/10 text-primary">🌟 Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh p-6 lg:p-8 xl:p-12">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8">
            <div className="space-y-4">
              <div className="h-8 bg-muted/50 rounded w-1/3 shimmer"></div>
              <div className="h-4 bg-muted/50 rounded shimmer"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // If client already has Second Me setup
  if (secondMe) {
    return (
      <div className="min-h-full gradient-mesh p-6 lg:p-8 xl:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple flex items-center gap-3">
              <Sparkles className="w-10 h-10" />
              Second Me - AI Avatar
            </h1>
            <p className="text-lg text-muted-foreground">
              Your AI digital twin for content creation
            </p>
          </div>

          {/* Status Card */}
          <Card className="glass-strong border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <User className="w-6 h-6" />
                    Your Avatar Status
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Track your Second Me creation and content
                  </CardDescription>
                </div>
                {getStatusBadge(secondMe.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              {secondMe.status === "processing" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Creating your AI avatar...</span>
                    <span className="text-primary">Processing</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              )}

              {/* Avatar Ready */}
              {secondMe.avatarUrl && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                  <img src={secondMe.avatarUrl} alt="AI Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                  <div>
                    <h4 className="font-semibold">Your AI Avatar is Ready!</h4>
                    <p className="text-sm text-muted-foreground">Start creating AI-generated content now</p>
                  </div>
                </div>
              )}

              {/* Subscription Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Setup Fee</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">Paid</span>
                    {secondMe.setupPaid ? (
                      <Check className="w-6 h-6 text-green-500" />
                    ) : (
                      <Button size="sm">Pay Now</Button>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Weekly Content</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">$80/week</span>
                    {secondMe.weeklySubscriptionActive ? (
                      <Badge className="bg-green-500/20 text-green-700">Active</Badge>
                    ) : (
                      <Button size="sm">Subscribe</Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos Uploaded */}
              <div>
                <h4 className="font-semibold mb-3">Uploaded Photos ({secondMe.photoUrls.length})</h4>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {secondMe.photoUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="aspect-square object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Content Preview */}
          {secondMe.weeklySubscriptionActive && (
            <Card className="glass-strong border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Video className="w-6 h-6" />
                  This Week's AI Content
                </CardTitle>
                <CardDescription>4 pieces of AI-generated content ready for you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <Card key={item} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">AI Content {item}</p>
                        <Badge variant="outline" className="mt-2 text-xs">Ready</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Initial setup - Upload photos
  return (
    <div className="min-h-full gradient-mesh p-4 md:p-6 lg:p-8 xl:p-12">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">
            Create Your Second Me
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload 15-20+ professional photos to create your AI digital twin.
            Get weekly AI-generated content featuring your avatar!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-strong border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Setup Fee</CardTitle>
              <CardDescription>One-time payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4">Contact Us</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  AI avatar creation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Higgsfield integration
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Lifetime avatar access
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-strong border-2 border-primary">
            <CardHeader>
              <Badge className="w-fit">Popular</Badge>
              <CardTitle>Weekly Content</CardTitle>
              <CardDescription>Recurring subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4">$80/week</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  4 AI-generated videos/images
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Professional content creation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Ready to post content
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Step 1: Upload Your Photos</CardTitle>
            <CardDescription>
              Upload 15-20+ professional photos: headshots, side shots, standing shots, different angles and lighting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Photos uploaded</span>
                <span className={uploadedPhotos.length >= 15 ? "text-green-500 font-semibold" : ""}>
                  {uploadedPhotos.length} / 20+
                </span>
              </div>
              <Progress 
                value={(uploadedPhotos.length / 20) * 100} 
                className="h-2"
              />
              {uploadedPhotos.length < 15 && (
                <p className="text-xs text-muted-foreground">
                  Minimum 15 photos required
                </p>
              )}
            </div>

            {/* Upload Requirements */}
            <Alert>
              <Upload className="w-4 h-4" />
              <AlertDescription>
                <strong>Photo Requirements:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>High quality, professional photos</li>
                  <li>Good lighting and clear face visibility</li>
                  <li>Different angles: front, side, 3/4 view</li>
                  <li>Various expressions and poses</li>
                  <li>Plain or simple backgrounds preferred</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Uploader */}
            <SimpleUploader onUploadComplete={handlePhotoUpload} />

            {/* Uploaded Photos Grid */}
            {uploadedPhotos.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Your Photos ({uploadedPhotos.length})</h4>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {uploadedPhotos.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${idx + 1}`}
                        className="aspect-square object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setUploadedPhotos([])}
                disabled={uploadedPhotos.length === 0}
              >
                Clear All
              </Button>
              <Button
                onClick={handleSubmitPhotos}
                disabled={uploadedPhotos.length < 15 || createSecondMeMutation.isPending}
                className="bg-gradient-to-r from-primary to-purple-500"
              >
                {createSecondMeMutation.isPending ? "Submitting..." : "Submit Photos & Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
