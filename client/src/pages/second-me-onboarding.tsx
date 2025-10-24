import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SimpleUploader } from "@/components/SimpleUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Camera, Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Upload } from "lucide-react";

interface OnboardingData {
  photos: string[];
  characterName: string;
  vibe: string;
  mission: string;
  storyWords: string;
  topics: string[];
  personalityType: string;
  dreamCollab: string;
  catchphrase: string;
  uniqueQuality: string;
  targetAudience: string;
  contentStyle: string;
  bio: string;
}

export default function SecondMeOnboarding() {
  const [step, setStep] = useState(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    photos: [],
    topics: [],
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const createSecondMeMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await apiRequest("POST", "/api/second-me", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/second-me"] });
      toast({
        title: "🎉 Your Second Me is Ready!",
        description: "We'll start generating your AI content soon!",
      });
      setStep(4); // Go to success screen
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create your Second Me. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (url: string) => {
    const newPhotos = [...uploadedPhotos, url];
    setUploadedPhotos(newPhotos);
    setFormData({ ...formData, photos: newPhotos });
  };

  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleSubmit = () => {
    if (!formData.characterName || uploadedPhotos.length < 5) {
      toast({
        title: "Missing Information",
        description: "Please upload at least 5 photos and complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    createSecondMeMutation.mutate(formData as OnboardingData);
  };

  const vibeOptions = ["Professional", "Creative", "Casual", "Inspirational", "Funny", "Motivational", "Educational"];
  const personalityOptions = ["Energetic", "Calm", "Bold", "Authentic", "Unstoppable", "Innovative", "Friendly"];
  const contentStyleOptions = ["Educational", "Entertainment", "Behind-the-scenes", "Motivational", "Lifestyle", "Tutorial"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Step {step} of {totalSteps}
            </h2>
            <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Photo Upload */}
        {step === 1 && (
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Camera className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Upload Your Photos</CardTitle>
                  <CardDescription>Upload 15-20+ professional photos for best results</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo} 
                      alt={`Upload ${index + 1}`} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploadedPhotos.length < 20 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center">
                    <SimpleUploader onUploadComplete={handlePhotoUpload} />
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-500 text-white">FREE BETA</Badge>
                  <span className="font-semibold text-sm">No Payment Required!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete setup and get weekly AI content at no cost during our testing phase.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">📸 Photo Tips:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ High quality, well-lit photos</li>
                  <li>✓ Different angles: front, side, 3/4 view</li>
                  <li>✓ Various expressions and poses</li>
                  <li>✓ Plain or simple backgrounds preferred</li>
                  <li>✓ Minimum 5 photos required (15-20+ recommended)</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <div></div>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={uploadedPhotos.length < 5}
                  size="lg"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Character Questionnaire - Part 1 */}
        {step === 2 && (
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-pink-500/10">
                  <Sparkles className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Build Your Character</CardTitle>
                  <CardDescription>Tell us about yourself to create your AI persona</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="characterName">What should we call your AI character? *</Label>
                <Input
                  id="characterName"
                  placeholder="e.g., Future Me, Digital Twin, AI Bobby..."
                  value={formData.characterName || ""}
                  onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="vibe">What's your vibe? *</Label>
                <Select 
                  value={formData.vibe} 
                  onValueChange={(value) => setFormData({ ...formData, vibe: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your vibe" />
                  </SelectTrigger>
                  <SelectContent>
                    {vibeOptions.map(vibe => (
                      <SelectItem key={vibe} value={vibe.toLowerCase()}>{vibe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mission">What's your mission? *</Label>
                <Textarea
                  id="mission"
                  placeholder="What do you want to be known for? What's your purpose?"
                  value={formData.mission || ""}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="storyWords">Your story in 3 words *</Label>
                <Input
                  id="storyWords"
                  placeholder="e.g., Bold, Authentic, Unstoppable"
                  value={formData.storyWords || ""}
                  onChange={(e) => setFormData({ ...formData, storyWords: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bio">Tell us about yourself *</Label>
                <Textarea
                  id="bio"
                  placeholder="Share your background, interests, and what makes you unique..."
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={!formData.characterName || !formData.vibe || !formData.mission}
                  size="lg"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Character Questionnaire - Part 2 */}
        {step === 3 && (
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Final Touches</CardTitle>
                  <CardDescription>Help us perfect your AI character</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="topics">What topics do you love talking about? *</Label>
                <Input
                  id="topics"
                  placeholder="e.g., Fitness, Business, Fashion, Food, Tech (comma-separated)"
                  value={formData.topics?.join(", ") || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    topics: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                  })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="personalityType">Your personality type *</Label>
                <Select 
                  value={formData.personalityType} 
                  onValueChange={(value) => setFormData({ ...formData, personalityType: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select personality type" />
                  </SelectTrigger>
                  <SelectContent>
                    {personalityOptions.map(type => (
                      <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dreamCollab">Dream collab?</Label>
                <Input
                  id="dreamCollab"
                  placeholder="Who would you love to work with?"
                  value={formData.dreamCollab || ""}
                  onChange={(e) => setFormData({ ...formData, dreamCollab: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="catchphrase">Your catchphrase or motto</Label>
                <Input
                  id="catchphrase"
                  placeholder="e.g., Stay Hungry, Stay Foolish"
                  value={formData.catchphrase || ""}
                  onChange={(e) => setFormData({ ...formData, catchphrase: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Who is your target audience? *</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Young entrepreneurs, fitness enthusiasts..."
                  value={formData.targetAudience || ""}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="contentStyle">Content style preference *</Label>
                <Select 
                  value={formData.contentStyle} 
                  onValueChange={(value) => setFormData({ ...formData, contentStyle: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select content style" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentStyleOptions.map(style => (
                      <SelectItem key={style} value={style.toLowerCase()}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createSecondMeMutation.isPending || !formData.topics?.length || !formData.targetAudience}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {createSecondMeMutation.isPending ? "Creating..." : "Create My Second Me"} 
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success Screen */}
        {step === 4 && (
          <Card className="glass-strong text-center">
            <CardContent className="py-12">
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">🎉 Your Second Me is Ready!</h2>
                <p className="text-muted-foreground text-lg">
                  We're creating your AI character right now. You'll start receiving content soon!
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">✨ What happens next?</h3>
                  <ul className="text-sm text-left space-y-2 text-muted-foreground">
                    <li>🤖 AI analyzes your photos and responses</li>
                    <li>🎨 Generates your digital avatar</li>
                    <li>📱 Creates 4 pieces of content weekly</li>
                    <li>📬 Delivers content to your dashboard</li>
                  </ul>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  onClick={() => setLocation("/second-me")}
                >
                  Go to My Second Me Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

