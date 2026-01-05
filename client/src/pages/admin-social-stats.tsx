import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { TrendingUp, Settings } from "lucide-react";
import { SocialAccountManager } from "@/components/SocialAccountManager";

export default function AdminSocialStats() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [, setLocation] = useLocation();

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Social Analytics Management</h1>
          <p className="text-muted-foreground mt-1">
            Automated social media statistics powered by ScrapeCreators
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/admin/social-accounts")} className="gap-2">
          <Settings className="w-4 h-4" /> Manage Connections
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Client</CardTitle>
            <CardDescription>View and refresh client stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="lg:col-span-3">
          {!selectedClient ? (
            <Card className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed">
              <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Select a client to get started</h3>
              <p className="text-sm text-muted-foreground mt-1">Choose a client from the left to view their automated social stats</p>
            </Card>
          ) : (
            <SocialAccountManager clientId={selectedClient} isAdmin={true} />
          )}
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Update Client Social Stats</h1>
          <p className="text-muted-foreground mt-1">
            Manually update social media statistics for your clients
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <FileImage className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-800 dark:text-blue-200">
            Pro Tip: You can paste screenshots too! (Coming soon)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Client</CardTitle>
            <CardDescription>Choose which client to update</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={(value) => {
                setSelectedClient(value);
                resetForm();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClient && (
              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground mb-3 block">Select Platform</Label>
                <div className="space-y-2">
                  {PLATFORMS.map((platform) => {
                    const PlatformIcon = platform.icon;
                    const isActive = selectedPlatform === platform.value;
                    const hasStats = stats.some(s => s.platform === platform.value);
                    
                    return (
                      <button
                        key={platform.value}
                        onClick={() => handlePlatformChange(platform.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-transparent hover:border-primary/30 hover:bg-accent'
                        }`}
                      >
                        <PlatformIcon className={`w-5 h-5 ${platform.color}`} />
                        <span className="flex-1 text-left font-medium">{platform.label}</span>
                        {hasStats && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                            Updated
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${currentPlatform?.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{currentPlatform?.label} Statistics</CardTitle>
                <CardDescription>Enter the latest stats for this platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedClient ? (
              <div className="py-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Select a client to get started</p>
                <p className="text-sm text-muted-foreground mt-1">Choose a client from the left to update their social media stats</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Screenshot Upload Section */}
                <Card className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border-2 border-dashed border-primary/30">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileImage className="w-5 h-5 text-primary" />
                        <Label className="text-base font-semibold">Upload Screenshot (Recommended)</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload a screenshot of the social media stats page - AI will automatically extract the numbers!
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <SimpleUploader
                          onUploadComplete={(url) => {
                            setUploadedScreenshot(url);
                            toast({
                              title: "✅ Screenshot Uploaded!",
                              description: "Click 'Extract Data' to auto-fill the form",
                            });
                          }}
                          buttonText={uploadedScreenshot ? "Change Screenshot" : "Upload Screenshot"}
                          accept="image/*"
                        />
                        
                        {uploadedScreenshot && (
                          <Button
                            type="button"
                            onClick={extractFromScreenshot}
                            disabled={isExtractingFromAI}
                            className="gap-2"
                          >
                            {isExtractingFromAI ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Extracting...
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Extract Data with AI
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {uploadedScreenshot && (
                        <div className="relative mt-2">
                          <img 
                            src={uploadedScreenshot} 
                            alt="Screenshot" 
                            className="w-full max-h-48 object-contain rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Manual Entry Section */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Or Enter Manually</Label>
                  <p className="text-sm text-muted-foreground">Fill in the stats below if you prefer manual entry</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Followers</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 23567"
                      value={formData.followers}
                      onChange={(e) => setFormData({...formData, followers: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Posts</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 432"
                      value={formData.posts}
                      onChange={(e) => setFormData({...formData, posts: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Engagement Rate (%)</Label>
                    <Input
                      type="text"
                      placeholder="e.g., 6.5 or 6.5%"
                      value={formData.engagement}
                      onChange={(e) => setFormData({...formData, engagement: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reach</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 28500"
                      value={formData.reach}
                      onChange={(e) => setFormData({...formData, reach: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Views</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 125000"
                      value={formData.views}
                      onChange={(e) => setFormData({...formData, views: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Growth Rate (%)</Label>
                    <Input
                      type="text"
                      placeholder="e.g., +12 or +12%"
                      value={formData.growthRate}
                      onChange={(e) => setFormData({...formData, growthRate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any additional context or observations..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateStatsMutation.isPending}
                    className="flex-1"
                  >
                    {updateStatsMutation.isPending ? "Saving..." : "Save Stats"}
                  </Button>
                </div>

                {stats.find(s => s.platform === selectedPlatform) && (
                  <div className="mt-4 p-3 bg-muted rounded-lg border">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(stats.find(s => s.platform === selectedPlatform)!.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

