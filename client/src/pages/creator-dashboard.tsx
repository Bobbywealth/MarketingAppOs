import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Camera, 
  Utensils, 
  DollarSign, 
  Calendar, 
  Upload, 
  Star,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CreatorVisit } from "@shared/schema";
import { format } from "date-fns";

export default function CreatorDashboard() {
  const { user } = useAuth();

  // Fetch upcoming visits for this creator
  const { data: visits = [] } = useQuery<CreatorVisit[]>({
    queryKey: ["/api/visits", { creatorId: user?.creatorId, status: "scheduled" }],
    enabled: !!user?.creatorId,
  });

  const upcomingVisits = visits.filter(v => v.status === 'scheduled');
  const completedVisits = visits.filter(v => v.status === 'completed').length;

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's everything you need to succeed.</p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="px-4 py-2 bg-primary text-primary-foreground shadow-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-bold">4.9 Performance Score</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Upcoming Visits</p>
                <p className="text-2xl font-bold">{upcomingVisits.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">$1,250.00</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completed Visits</p>
                <p className="text-2xl font-bold">18</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Course Progress</p>
                <p className="text-2xl font-bold">65%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Upcoming Visits & Tools */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Your Next Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingVisits.length > 0 ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold text-lg">Joe's Pizza & Grill</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(upcomingVisits[0].scheduledStart), 'EEEE, MMM d @ h:mm a')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold">Objective:</span> High-quality social reels & interior shots.
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button className="flex-1 md:flex-none">Visit Details</Button>
                    <Button variant="outline" className="flex-1 md:flex-none gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Content
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No upcoming visits scheduled.</p>
                  <Button variant="link" className="text-primary mt-2">Browse Available Visits</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Training Courses */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Training & Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                    <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">Mastering Content Creation</CardTitle>
                  <CardDescription>Learn how to film, edit, and post high-performing reels.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>80%</span>
                    </div>
                    <Progress value={80} className="h-1.5" />
                    <Link href="/training/mastering-content">
                      <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
                        Continue Learning
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/50 transition-colors cursor-pointer group border-primary/40 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                    <Utensils className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg text-primary">Working with Restaurants</CardTitle>
                  <CardDescription>Professional etiquette and how to get the best shots on site.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-primary">
                      <span>New Course</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} className="h-1.5" />
                    <Link href="/course">
                      <Button variant="default" className="w-full justify-between mt-2">
                        Start Course
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Sidebar: Success Tools & Tips */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Success Toolkit
              </CardTitle>
              <CardDescription>Tools to help you grow your creator career.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Upload className="h-4 w-4" />
                  </div>
                  Quick Content Upload
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  Earnings & Invoices
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Star className="h-4 w-4" />
                  </div>
                  Performance Insights
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Pro Tip of the Day</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-indigo-50 leading-relaxed">
                "When shooting food, try to use natural side-lighting. It brings out the texture and makes the dish look much more appetizing on screen!"
              </p>
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified by Lead Editor</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

