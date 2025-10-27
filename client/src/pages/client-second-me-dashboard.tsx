import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Download, Calendar, TrendingUp, Image as ImageIcon, Video, ExternalLink, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface SecondMeCharacter {
  id: string;
  characterName: string;
  vibe: string;
  mission: string;
  storyWords: string;
  topics: string[];
  personalityType: string;
  dreamCollab?: string;
  catchphrase?: string;
  targetAudience: string;
  contentStyle: string;
  bio: string;
  photos: string[];
  weeklySubscriptionActive: boolean;
  createdAt: string;
}

interface ContentPiece {
  id: string;
  title: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  createdAt: string;
  description?: string;
}

export default function ClientSecondMeDashboard() {
  const [, setLocation] = useLocation();

  const { data: character, isLoading } = useQuery<SecondMeCharacter>({
    queryKey: ["/api/second-me/character"],
  });

  const { data: content = [] } = useQuery<ContentPiece[]>({
    queryKey: ["/api/second-me/content"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your Second Me...</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full glass-strong text-center">
          <CardContent className="py-12">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Create Your Second Me</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Upload 15-20+ professional photos to create your AI digital twin. Get weekly AI-generated photos, videos, and multimedia content featuring your digital visual avatar!
              </p>
            </div>

            <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-400 mb-8">
              <div className="text-center">
                <Badge className="mb-3 bg-green-500 text-white text-lg px-4 py-2">🎉 FREE BETA ACCESS</Badge>
                <h3 className="text-2xl font-bold mb-2">No Payment Required - Testing Phase</h3>
                <p className="text-muted-foreground mb-4">
                  Create your AI character and receive weekly content at no cost during our beta period!
                </p>
                <ul className="text-left max-w-md mx-auto space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Complete AI avatar creation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>4 AI-generated photos/videos weekly featuring your digital twin</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Professional content ready to post</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>No credit card required</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => setLocation("/second-me/onboarding")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Creating Your Second Me
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloadContent = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Second Me
            </h1>
            <p className="text-muted-foreground">AI-powered digital twin creating content for you</p>
          </div>
          {character.weeklySubscriptionActive && (
            <Badge className="bg-green-500/20 text-green-700 text-sm px-4 py-2">
              🎉 Active • FREE BETA
            </Badge>
          )}
        </div>

        {/* Character Profile */}
        <Card className="glass-strong">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={character.photos[0]} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                    {character.characterName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{character.characterName}</CardTitle>
                  <CardDescription className="text-base mt-1">{character.bio}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">✨ Vibe</h4>
                <Badge variant="secondary" className="capitalize">{character.vibe}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">🎯 Mission</h4>
                <p className="text-sm">{character.mission}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">🚀 Story</h4>
                <p className="text-sm font-semibold">{character.storyWords}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">💭 Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {character.topics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{topic}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">👤 Personality</h4>
                <Badge variant="secondary" className="capitalize">{character.personalityType}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">🎬 Content Style</h4>
                <Badge variant="secondary" className="capitalize">{character.contentStyle}</Badge>
              </div>
            </div>

            {character.catchphrase && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                <p className="text-sm font-semibold text-purple-700">"{character.catchphrase}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-strong">
            <CardHeader className="pb-3">
              <CardDescription>Total Content</CardDescription>
              <CardTitle className="text-3xl">{content.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="pb-3">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-3xl">
                {content.filter(c => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(c.createdAt) > weekAgo;
                }).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                <span>New content</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="pb-3">
              <CardDescription>Member Since</CardDescription>
              <CardTitle className="text-3xl">
                {new Date(character.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 mr-1 text-purple-500" />
                <span>{formatDistanceToNow(new Date(character.createdAt))} ago</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Gallery */}
        <Card className="glass-strong">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your AI Content Gallery</CardTitle>
                <CardDescription>Download and share your AI-generated content</CardDescription>
              </div>
              {content.length === 0 && character.weeklySubscriptionActive && (
                <Badge className="bg-blue-500/20 text-blue-700">
                  First batch coming soon!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {content.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 opacity-20">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your AI-generated content will appear here once created.
                  {character.weeklySubscriptionActive && " Check back soon!"}
                </p>
                {!character.weeklySubscriptionActive && (
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Subscribe for Weekly Content
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.map((item) => (
                  <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100">
                      {item.type === "image" ? (
                        <img 
                          src={item.thumbnail || item.url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={item.url}
                          poster={item.thumbnail}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="backdrop-blur-sm bg-black/50 text-white">
                          {item.type === "image" ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-1 line-clamp-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt))} ago
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadContent(item.url, `${item.title}.${item.type === 'video' ? 'mp4' : 'jpg'}`)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(item.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
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
      </div>
    </div>
  );
}

