import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Calendar, DollarSign, Target, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function ClientCampaigns() {
  const { data: user } = useQuery({ queryKey: ["/api/user"] });
  
  // Fetch client's campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: !!user,
  });

  // Filter campaigns for this client
  const clientCampaigns = campaigns.filter((campaign: any) => 
    campaign.clientId === user?.clientId
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-200";
      case "planning": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "paused": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "completed": return "bg-gray-500/10 text-gray-600 border-gray-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "social": return "📱";
      case "ads": return "📢";
      case "content": return "📝";
      case "email": return "📧";
      default: return "📊";
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
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-12 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple">
            My Campaigns
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Track the progress of your marketing campaigns
          </p>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Total Campaigns</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">{clientCampaigns.length}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Active</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                    {clientCampaigns.filter((c: any) => c.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Planning</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                    {clientCampaigns.filter((c: any) => c.status === 'planning').length}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Completed</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                    {clientCampaigns.filter((c: any) => c.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold">All Campaigns</h2>
          
          {clientCampaigns.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground">
                  Your marketing team will create campaigns for you soon.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {clientCampaigns.map((campaign: any) => (
                <Card key={campaign.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                          <span className="text-lg sm:text-2xl">{getTypeIcon(campaign.type)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg truncate">{campaign.name}</CardTitle>
                          <CardDescription className="capitalize text-xs sm:text-sm">{campaign.type} Campaign</CardDescription>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(campaign.status)} border text-xs`}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                    
                    {campaign.goals && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Goals:</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {campaign.goals}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      {campaign.budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>${(campaign.budget / 100).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {campaign.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{format(new Date(campaign.startDate), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                    
                    {campaign.startDate && campaign.endDate && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>
                            {Math.round(
                              ((new Date().getTime() - new Date(campaign.startDate).getTime()) / 
                               (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime())) * 100
                            )}%
                          </span>
                        </div>
                        <Progress 
                          value={
                            Math.min(100, Math.max(0,
                              ((new Date().getTime() - new Date(campaign.startDate).getTime()) / 
                               (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime())) * 100
                            ))
                          } 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}</span>
                      {campaign.updatedAt !== campaign.createdAt && (
                        <span>Updated {formatDistanceToNow(new Date(campaign.updatedAt), { addSuffix: true })}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
