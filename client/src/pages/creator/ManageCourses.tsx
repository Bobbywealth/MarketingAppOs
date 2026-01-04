import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Play } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Course } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ManageCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses", { creatorId: user?.creatorId }],
    enabled: !!user?.creatorId,
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course deleted", description: "The course has been removed." });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/courses", {
        title: "New Course",
        description: "Enter course description here",
        status: "draft",
        creatorId: user?.creatorId,
      });
      return res.json();
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setLocation(`/manage-courses/${course.id}`);
    },
  });

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Your Courses</h1>
          <p className="text-muted-foreground">Create and manage your educational content.</p>
        </div>
        <Button onClick={() => createCourseMutation.mutate()} disabled={createCourseMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Course
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-t-xl" />
              <CardHeader className="space-y-2">
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed flex flex-col items-center justify-center py-12">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>No courses yet</CardTitle>
            <CardDescription>Click the button above to create your first course.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/10">
              <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/20">
                    <Play className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                    {course.status}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">{course.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <div className="flex gap-2">
                  <Link href={`/manage-courses/${course.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/course/${course.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </Link>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this course?")) {
                      deleteCourseMutation.mutate(course.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

