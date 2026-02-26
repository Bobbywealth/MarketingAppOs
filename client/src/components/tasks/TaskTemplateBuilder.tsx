import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Settings,
  Calendar,
  Repeat,
  Tags,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  Wand2,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TaskTemplate, TaskSpace, Client } from "@shared/schema";

// Form schema for template
const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  title: z.string().min(1, "Task title is required"),
  taskDescription: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "completed"]).default("todo"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueDateOffset: z.number().optional(),
  estimatedHours: z.number().min(0).optional(),
  spaceId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurringInterval: z.number().min(1).default(1),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TaskTemplateBuilderProps {
  template?: TaskTemplate;
  trigger?: React.ReactNode;
  onSave?: (template: TaskTemplate) => void;
  onClose?: () => void;
}

export function TaskTemplateBuilder({ 
  template, 
  trigger,
  onSave,
  onClose 
}: TaskTemplateBuilderProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; text: string; completed: boolean }>>(
    template?.checklist as Array<{ id: string; text: string; completed: boolean }> || []
  );
  const [tags, setTags] = useState<string[]>((template?.tags as string[]) || []);
  const [newTag, setNewTag] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const { toast } = useToast();

  // Fetch spaces for dropdown
  const { data: spaces = [] } = useQuery<TaskSpace[]>({
    queryKey: ["/api/task-spaces"],
  });

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      title: template?.title || "",
      taskDescription: template?.taskDescription || "",
      status: (template?.status as TemplateFormValues["status"]) || "todo",
      priority: (template?.priority as TemplateFormValues["priority"]) || "normal",
      dueDateOffset: template?.dueDateOffset || undefined,
      estimatedHours: template?.estimatedHours || undefined,
      spaceId: template?.spaceId || undefined,
      isRecurring: template?.isRecurring || false,
      recurringPattern: (template?.recurringPattern as TemplateFormValues["recurringPattern"]) || undefined,
      recurringInterval: template?.recurringInterval || 1,
      checklist: (template?.checklist as TemplateFormValues["checklist"]) || [],
      tags: (template?.tags as string[]) || [],
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const payload = {
        ...data,
        checklist: checklistItems,
        tags,
      };
      
      if (template?.id) {
        const res = await apiRequest("PATCH", `/api/task-templates/${template.id}`, payload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/task-templates", payload);
        return res.json();
      }
    },
    onSuccess: (savedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-templates"] });
      toast({
        title: template ? "Template updated" : "Template created",
        description: `Task template has been ${template ? "updated" : "created"} successfully.`,
      });
      onSave?.(savedTemplate);
      setOpen(false);
      setCurrentStep(0);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save template",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([
        ...checklistItems,
        { id: crypto.randomUUID(), text: newChecklistItem.trim(), completed: false },
      ]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = (data: TemplateFormValues) => {
    saveMutation.mutate(data);
  };

  const steps = [
    { title: "Basic Info", description: "Name and description", icon: FileText },
    { title: "Task Details", description: "Title, status, priority", icon: Settings },
    { title: "Checklist", description: "Subtasks and items", icon: Check },
    { title: "Recurrence", description: "Recurring settings", icon: Repeat },
    { title: "Tags & Space", description: "Organization", icon: Tags },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Wand2 className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Task Template" : "Create Task Template"}
          </DialogTitle>
          <DialogDescription>
            Build a reusable task template with predefined settings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`
                      flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                      ${currentStep === index 
                        ? "bg-primary text-primary-foreground" 
                        : currentStep > index
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"}
                    `}
                  >
                    <step.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className={`h-4 w-4 mx-2 ${
                      currentStep > index ? "text-primary" : "text-muted-foreground"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <Separator />

            <ScrollArea className="h-[400px] pr-4">
              {/* Step 1: Basic Info */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Weekly Report Task" {...field} />
                        </FormControl>
                        <FormDescription>
                          A unique name to identify this template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe when and how to use this template..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Task Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Task Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Submit weekly report" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taskDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Default task description..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDateOffset"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date Offset (days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 7 for 1 week"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Days from creation until due date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.5"
                              placeholder="e.g., 2.5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Checklist */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Default Checklist Items</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add subtasks that will be included when using this template
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add checklist item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())}
                    />
                    <Button type="button" onClick={handleAddChecklistItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {checklistItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="flex-1">{item.text}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {checklistItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No checklist items added yet
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Recurrence */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Recurring Task</FormLabel>
                          <FormDescription>
                            Automatically create new tasks on a schedule
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("isRecurring") && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="recurringPattern"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recurringInterval"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Every</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Tags & Space */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="spaceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Space</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a space" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {spaces.map((space) => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Tasks created from this template will be added to this space
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label>Tags</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add tags to categorize tasks created from this template
                    </p>

                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" onClick={handleAddTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      {tags.length === 0 && (
                        <p className="text-sm text-muted-foreground">No tags added</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {template ? "Update Template" : "Create Template"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskTemplateBuilder;
