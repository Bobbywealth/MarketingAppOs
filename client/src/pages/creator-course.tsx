import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Video, 
  FileText, 
  CheckCircle2, 
  PlayCircle,
  ChevronRight,
  ChevronLeft,
  Menu,
  Lock
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { Course, CourseModule, CourseLesson, CourseEnrollment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";

type CourseWithContent = Course & { 
  modules: (CourseModule & { lessons: CourseLesson[] })[] 
};

export default function CreatorCoursePlayer() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/course/:id");
  const courseId = params?.id;

  const { data: course, isLoading } = useQuery<CourseWithContent>({
    queryKey: [`/api/courses/${courseId}/content`],
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery<CourseEnrollment>({
    queryKey: [`/api/courses/enrollments/${courseId}`],
    enabled: !!courseId && !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/courses/enrollments", {
        courseId,
        status: "enrolled",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/enrollments/${courseId}`] });
    },
  });

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-select first lesson
  useEffect(() => {
    if (course && !activeLessonId && course.modules.length > 0) {
      const firstLesson = course.modules[0].lessons[0];
      if (firstLesson) setActiveLessonId(firstLesson.id);
    }
  }, [course, activeLessonId]);

  const activeLesson = course?.modules
    .flatMap(m => m.lessons)
    .find(l => l.id === activeLessonId);

  const updateProgressMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!enrollment) return;
      const newProgress = { ...(enrollment.progress || {}), [lessonId]: true };
      await apiRequest("PATCH", `/api/courses/enrollments/${enrollment.id}`, {
        progress: newProgress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/enrollments/${courseId}`] });
    },
  });

  if (isLoading || !course) return <div className="p-8 text-center">Loading course...</div>;

  const totalLessons = course.modules.flatMap(m => m.lessons).length;
  const completedLessons = enrollment ? Object.keys(enrollment.progress || {}).length : 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} border-r transition-all duration-300 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex flex-col`}>
        <div className="p-4 border-b space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="space-y-2">
            <h2 className="font-bold text-lg line-clamp-1">{course.title}</h2>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Your Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {course.modules.map((module, mIdx) => (
            <div key={module.id} className="mb-2">
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/50 font-bold text-sm flex items-center gap-2">
                <span className="text-primary/50">{mIdx + 1}</span>
                {module.title}
              </div>
              <div className="space-y-1 p-2">
                {module.lessons.map((lesson) => {
                  const isCompleted = enrollment?.progress?.[lesson.id];
                  const isActive = activeLessonId === lesson.id;
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={`w-full text-left p-3 rounded-lg text-sm flex items-center justify-between transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {lesson.contentType === 'video' ? <Video className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                        <span className="line-clamp-1">{lesson.title}</span>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-green-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Player Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
        <header className="h-16 border-b flex items-center justify-between px-4 sticky top-0 bg-white dark:bg-slate-950 z-10">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            {!enrollment && (
              <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                Enroll to Save Progress
              </Button>
            )}
            {activeLesson && enrollment && (
              <Button 
                variant={enrollment.progress?.[activeLesson.id] ? "outline" : "default"}
                onClick={() => updateProgressMutation.mutate(activeLesson.id)}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {enrollment.progress?.[activeLesson.id] ? "Completed" : "Mark as Complete"}
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          {activeLesson ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {activeLesson.contentType === 'video' && activeLesson.contentUrl ? (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <video 
                    src={activeLesson.contentUrl} 
                    controls 
                    className="w-full h-full"
                    onEnded={() => enrollment && updateProgressMutation.mutate(activeLesson.id)}
                  />
                </div>
              ) : activeLesson.contentType === 'video' ? (
                <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed">
                  <PlayCircle className="h-12 w-12 mb-4 opacity-20" />
                  <p>Video content is currently unavailable.</p>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold">
                  {activeLesson.contentType === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  <span className="uppercase tracking-widest text-sm">{activeLesson.contentType} Lesson</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">{activeLesson.title}</h1>
                <Separator />
                <div className="prose dark:prose-invert max-w-none">
                  {activeLesson.textContent ? (
                    <div dangerouslySetInnerHTML={{ __html: activeLesson.textContent }} />
                  ) : (
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      {activeLesson.description || "No description provided for this lesson."}
                    </p>
                  )}
                  
                  {activeLesson.contentType === 'document' && activeLesson.contentUrl && (
                    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-bold">Attached Document</p>
                          <p className="text-sm text-muted-foreground">Download the resources for this lesson.</p>
                        </div>
                      </div>
                      <Button asChild>
                        <a href={activeLesson.contentUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex justify-between pt-12 border-t">
                <Button variant="outline" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Previous Lesson
                </Button>
                <Button className="gap-2">
                  Next Lesson
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <PlayCircle className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Select a lesson to begin</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose a lesson from the sidebar to start your learning journey in {course.title}.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
