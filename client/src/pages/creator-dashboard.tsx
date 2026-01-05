import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
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
  ArrowRight,
  X,
  FileText,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CreatorVisit, Course, Creator } from "@shared/schema";
import { format, isSameDay, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SimpleUploader } from "@/components/SimpleUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Fetch creator profile
  const { data: creator } = useQuery<Creator>({
    queryKey: [`/api/creators/${user?.creatorId}`],
    enabled: !!user?.creatorId,
  });

  // Mutation to update availability
  const availabilityMutation = useMutation({
    mutationFn: async (newAvailability: Record<string, "available" | "unavailable">) => {
      const res = await apiRequest("PATCH", "/api/creators/me/availability", { availability: newAvailability });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${user?.creatorId}`] });
      toast({
        title: "Availability Updated",
        description: "Your availability calendar has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update availability.",
        variant: "destructive",
      });
    }
  });

  const toggleAvailability = (date: Date) => {
    if (!creator) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const currentStatus = creator.availability?.[dateStr];
    
    let newStatus: "available" | "unavailable" | null = null;
    if (!currentStatus) newStatus = "available";
    else if (currentStatus === "available") newStatus = "unavailable";
    else newStatus = null; // Remove the entry

    const newAvailability = { ...(creator.availability || {}) };
    if (newStatus) {
      newAvailability[dateStr] = newStatus;
    } else {
      delete newAvailability[dateStr];
    }

    availabilityMutation.mutate(newAvailability);
  };

  // Mutation to submit uploaded content
  const uploadMutation = useMutation({
    mutationFn: async ({ visitId, urls }: { visitId: string, urls: string[] }) => {
      const res = await apiRequest("POST", `/api/visits/${visitId}/upload`, { uploadLinks: urls });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Content Submitted!",
        description: "Your content has been successfully uploaded and the visit is marked as completed.",
      });
      setUploadModalOpen(false);
      setUploadedUrls([]);
      setSelectedVisitId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Could not submit content links.",
        variant: "destructive",
      });
    }
  });

  const handleUploadClick = (visitId: string) => {
    setSelectedVisitId(visitId);
    setUploadedUrls([]);
    setUploadModalOpen(true);
  };

  const handleAddUrl = (url: string) => {
    setUploadedUrls(prev => [...prev, url]);
  };

  const removeUrl = (index: number) => {
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitContent = () => {
    if (!selectedVisitId || uploadedUrls.length === 0) return;
    uploadMutation.mutate({ visitId: selectedVisitId, urls: uploadedUrls });
  };

  // Fetch upcoming visits for this creator
  const { data: visits = [] } = useQuery<CreatorVisit[]>({
    queryKey: ["/api/visits", { creatorId: user?.creatorId, status: "scheduled" }],
    enabled: !!user?.creatorId,
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/courses/enrollments/me"],
    enabled: !!user,
  });

  const upcomingVisits = visits.filter(v => v.status === 'scheduled');
  const completedVisitsCount = visits.filter(v => v.status === 'completed').length;

  // Calculate total earned from completed visits (using the creator's rate)
  const totalEarnedCents = visits
    .filter(v => v.status === 'completed')
    .reduce((sum, v) => sum + (creator?.ratePerVisitCents || 0), 0);
  const totalEarned = totalEarnedCents / 100;

  const getProgress = (courseId: string) => {
    const enrollment = enrollments.find(e => e.courseId === courseId);
    if (!enrollment) return 0;
    return enrollment.status === 'completed' ? 100 : 0; 
  };

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
              <span className="font-bold">{creator?.performanceScore || "—"} Performance Score</span>
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
                <p className="text-2xl font-bold">${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                <p className="text-2xl font-bold">{completedVisitsCount}</p>
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
                <p className="text-2xl font-bold">
                  {enrollments.length > 0 
                    ? `${Math.round(enrollments.reduce((acc, e) => acc + (e.status === 'completed' ? 100 : 25), 0) / enrollments.length)}%`
                    : "0%"}
                </p>
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
                      <span className="font-bold text-lg">{(upcomingVisits[0] as any).clientName || "Unknown Client"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(upcomingVisits[0].scheduledStart), 'EEEE, MMM d @ h:mm a')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold">Objective:</span> {upcomingVisits[0].notes || "High-quality social reels & interior shots."}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Link href={`/visit/${upcomingVisits[0].id}`}>
                      <Button className="flex-1 md:flex-none" variant="secondary">Visit Details</Button>
                    </Link>
                    <Button 
                      className="flex-1 md:flex-none gap-2"
                      onClick={() => handleUploadClick(upcomingVisits[0].id)}
                    >
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Training & Courses
              </h2>
            </div>
            
            {courses.length === 0 ? (
              <Card className="border-dashed py-12 text-center">
                <p className="text-muted-foreground">No courses available at this time.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.filter(c => c.status === 'published').map((course) => {
                  const progress = getProgress(course.id);
                  const isEnrolled = enrollments.some(e => e.courseId === course.id);
                  
                  return (
                    <Card key={course.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                      <CardHeader className="pb-2">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                          <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 mt-2">
                          {isEnrolled && (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span>Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </>
                          )}
                          <Link href={`/course/${course.id}`}>
                            <Button variant={isEnrolled ? "ghost" : "default"} className="w-full justify-between group-hover:bg-primary/5">
                              {isEnrolled ? "Continue Learning" : "Start Course"}
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Availability & Success Tools */}
        <div className="space-y-6">
          {/* Availability Calendar */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Availability
              </CardTitle>
              <CardDescription>Mark your available and unavailable days.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <CalendarUI
                mode="single"
                onSelect={(date) => date && toggleAvailability(date)}
                className="rounded-md border"
                modifiers={{
                  available: (date) => creator?.availability?.[format(date, "yyyy-MM-dd")] === "available",
                  unavailable: (date) => creator?.availability?.[format(date, "yyyy-MM-dd")] === "unavailable",
                }}
                modifiersClassNames={{
                  available: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 rounded-md",
                  unavailable: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 rounded-md",
                }}
              />
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground italic">
                  * Click a date to toggle status
                </div>
              </div>
            </CardContent>
          </Card>

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
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    if (upcomingVisits.length > 0) {
                      handleUploadClick(upcomingVisits[0].id);
                    } else {
                      toast({
                        title: "No active visit",
                        description: "You don't have any upcoming visits to upload content for.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
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

        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Content</DialogTitle>
            <DialogDescription>
              Upload reels, photos, or videos for your visit. These will be sent to the client for approval.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <SimpleUploader 
              onUploadComplete={handleAddUrl} 
              buttonText="Select File to Upload"
              accept="image/*,video/*"
            />
            
            {uploadedUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files ({uploadedUrls.length})</p>
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {uploadedUrls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border text-xs group">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[200px]">{url.split('/').pop()}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeUrl(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitContent} 
              disabled={uploadedUrls.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

