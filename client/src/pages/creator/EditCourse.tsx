import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  GripVertical, 
  Video, 
  FileText, 
  CheckCircle2, 
  Save, 
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Course, CourseModule, CourseLesson } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type CourseWithContent = Course & { 
  modules: (CourseModule & { lessons: CourseLesson[] })[] 
};

export default function EditCourse() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/manage-courses/:id");
  const [, setLocation] = useLocation();
  const courseId = params?.id;

  const { data: course, isLoading } = useQuery<CourseWithContent>({
    queryKey: [`/api/courses/${courseId}/content`],
    enabled: !!courseId,
  });

  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState("video");

  const updateCourseMutation = useMutation({
    mutationFn: async (data: Partial<Course>) => {
      await apiRequest("PATCH", `/api/courses/${courseId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/content`] });
      toast({ title: "Course updated", description: "Your changes have been saved." });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (title: string) => {
      await apiRequest("POST", `/api/courses/${courseId}/modules`, {
        title,
        order: (course?.modules.length || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/content`] });
      setIsModuleDialogOpen(false);
      setNewModuleTitle("");
      toast({ title: "Module added" });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async ({ moduleId, title, contentType }: { moduleId: string, title: string, contentType: string }) => {
      await apiRequest("POST", `/api/courses/modules/${moduleId}/lessons`, {
        title,
        contentType,
        order: 0, // In a real app, calculate order
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/content`] });
      setIsLessonDialogOpen(false);
      setNewLessonTitle("");
      toast({ title: "Lesson added" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await apiRequest("DELETE", `/api/courses/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/content`] });
      toast({ title: "Lesson deleted" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      await apiRequest("DELETE", `/api/courses/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/content`] });
      toast({ title: "Module deleted" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiRequest("POST", "/api/upload", formData);
      const data = await res.json();
      
      if (data.url) {
        await apiRequest("PATCH", `/api/courses/lessons/${lessonId}`, {
          contentUrl: data.url,
        });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/content`] });
        toast({ title: "Content uploaded successfully" });
      }
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  if (isLoading || !course) return <div className="p-8 text-center">Loading builder...</div>;

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/manage-courses")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Builder</h1>
            <p className="text-muted-foreground">{course.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation(`/course/${courseId}`)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => updateCourseMutation.mutate(editingCourse)} disabled={updateCourseMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Settings */}
        <Card className="lg:col-span-1 h-fit sticky top-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Course Title</Label>
              <Input 
                defaultValue={course.title} 
                onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                defaultValue={course.description || ""} 
                onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                defaultValue={course.status} 
                onValueChange={(val) => setEditingCourse({...editingCourse, status: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    value={editingCourse.thumbnailUrl || course.thumbnailUrl || ""} 
                    onChange={(e) => setEditingCourse({...editingCourse, thumbnailUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <Label htmlFor="thumbnail-upload" className="cursor-pointer">
                  <Button variant="outline" size="icon" asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                    </span>
                  </Button>
                  <Input 
                    id="thumbnail-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await apiRequest("POST", "/api/upload", formData);
                      const data = await res.json();
                      if (data.url) setEditingCourse({...editingCourse, thumbnailUrl: data.url});
                    }}
                    accept="image/*"
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Curriculum Builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Curriculum</h2>
            <Button variant="outline" size="sm" onClick={() => setIsModuleDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>

          <div className="space-y-4">
            {course.modules.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-white/50 dark:bg-slate-900/50">
                <p className="text-muted-foreground">Start by adding your first module.</p>
              </div>
            ) : (
              course.modules.map((module) => (
                <Card key={module.id} className="border-primary/5 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-bold">{module.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setCurrentModuleId(module.id);
                        setIsLessonDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("Delete this module and all its lessons?")) {
                          deleteModuleMutation.mutate(module.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 group transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                              {lesson.contentType === 'video' ? <Video className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-purple-500" />}
                            </div>
                            <div>
                              <p className="font-medium">{lesson.title}</p>
                              {lesson.contentUrl ? (
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Content Uploaded
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">No content yet</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Label htmlFor={`file-${lesson.id}`} className="cursor-pointer">
                              <Button variant="ghost" size="sm" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </span>
                              </Button>
                              <Input 
                                id={`file-${lesson.id}`} 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(e, lesson.id)}
                                accept={lesson.contentType === 'video' ? 'video/*' : '*/*'}
                              />
                            </Label>
                            <Button variant="ghost" size="icon" onClick={() => {
                              if (confirm("Delete this lesson?")) {
                                deleteLessonMutation.mutate(lesson.id);
                              }
                            }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {module.lessons.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground italic">
                          No lessons in this module.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Module Title</Label>
            <Input 
              value={newModuleTitle} 
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="e.g. Introduction to Restaurant Photography"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createModuleMutation.mutate(newModuleTitle)}>Add Module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lesson Title</Label>
              <Input 
                value={newLessonTitle} 
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="e.g. Getting the Perfect Lighting"
              />
            </div>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select defaultValue="video" onValueChange={setNewLessonType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document / PDF</SelectItem>
                  <SelectItem value="text">Text Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createLessonMutation.mutate({ 
              moduleId: currentModuleId!, 
              title: newLessonTitle, 
              contentType: newLessonType 
            })}>
              Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

