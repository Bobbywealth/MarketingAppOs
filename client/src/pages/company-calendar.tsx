import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { resolveApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
  Link as LinkIcon,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Settings,
  ExternalLink,
  Phone,
  AlertCircle,
  FileText,
  Zap,
  Filter,
  X,
  Repeat,
  CheckSquare,
  ArrowUpRight,
  Circle,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  differenceInHours,
  isPast,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  setHours,
  setMinutes,
  setSeconds
} from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  type: "meeting" | "call" | "deadline" | "reminder" | "event";
  color?: string;
  googleEventId?: string;
  meetLink?: string;
  // Recurrence fields
  isRecurring?: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceDaysOfWeek?: number[];
  recurrenceDayOfMonth?: number;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}

interface CalendarTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate: string;
  assignedToId?: number | null;
  clientId?: string | null;
  campaignId?: string | null;
  spaceId?: string | null;
  completedAt?: string | null;
  estimatedHours?: number | null;
  checklist?: any;
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-600", label: "Urgent" },
  high: { color: "bg-orange-500", label: "High" },
  normal: { color: "bg-blue-500", label: "Normal" },
  low: { color: "bg-gray-400", label: "Low" },
};

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  todo: { icon: Circle, label: "To Do", color: "text-gray-400" },
  in_progress: { icon: Clock, label: "In Progress", color: "text-blue-500" },
  review: { icon: AlertCircle, label: "Review", color: "text-yellow-500" },
  completed: { icon: CheckCircle2, label: "Completed", color: "text-green-500" },
};

const EVENT_TYPE_CONFIG = {
  meeting: {
    icon: Users,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    textColor: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    emoji: "👥"
  },
  call: {
    icon: Phone,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    textColor: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    emoji: "📞"
  },
  deadline: {
    icon: AlertCircle,
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    textColor: "text-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    emoji: "🚨"
  },
  reminder: {
    icon: Clock,
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600",
    textColor: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    emoji: "⏰"
  },
  event: {
    icon: Zap,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
    textColor: "text-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    emoji: "🎉"
  },
  task: {
    icon: CheckSquare,
    color: "bg-teal-500",
    hoverColor: "hover:bg-teal-600",
    textColor: "text-teal-600",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    emoji: "✅"
  },
};

export default function CompanyCalendarPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [showTasks, setShowTasks] = useState(true);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  // Calculate dates based on current view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  // Week view dates
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Day view date
  const dayDate = currentDate;
  const eventsQueryUrl = `/api/calendar/events?start=${encodeURIComponent(
    calendarStart.toISOString()
  )}&end=${encodeURIComponent(calendarEnd.toISOString())}`;
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    location: "",
    type: "meeting",
    syncWithGoogle: false,
    // Recurrence fields
    isRecurring: false,
    recurrencePattern: "weekly",
    recurrenceDaysOfWeek: [],
    recurrenceInterval: 1,
    recurrenceEndDate: "",
  });

  // Real connection status (Outlook/Microsoft Graph via existing email account connection)
  const { data: calendarConnection } = useQuery<{ connected: boolean; provider: string | null; email?: string }>({
    queryKey: ["/api/calendar/connection"],
  });

  // Fetch calendar events from API
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: [eventsQueryUrl],
  });

  // Fetch tasks with due dates for calendar overlay
  const { data: calendarTasks = [] } = useQuery<CalendarTask[]>({
    queryKey: ["/api/calendar/tasks"],
  });

  // Update last sync time when events load
  useEffect(() => {
    if (events.length > 0) {
      setLastSyncTime(new Date());
    }
  }, [events]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return await apiRequest("POST", "/api/calendar/events", eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [eventsQueryUrl] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "✅ Event created!",
        description: "Calendar event has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/calendar/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [eventsQueryUrl] });
      setIsViewDialogOpen(false);
      setIsEditMode(false);
      setSelectedEvent(null);
      toast({
        title: "✅ Event updated!",
        description: "Calendar event has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update event",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/calendar/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [eventsQueryUrl] });
      setIsViewDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "✅ Event deleted!",
        description: "Calendar event has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete event",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start: "",
      end: "",
      location: "",
      type: "meeting",
      syncWithGoogle: false,
    });
  };

  const handleCreateEvent = () => {
    if (!formData.title || !formData.start || !formData.end) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      title: formData.title,
      description: formData.description || null,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      location: formData.location || null,
      type: formData.type,
      syncWithGoogle: formData.syncWithGoogle,
      // Recurrence fields
      isRecurring: formData.isRecurring,
      recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
      recurrenceDaysOfWeek: formData.isRecurring && formData.recurrencePattern === "weekly" ? formData.recurrenceDaysOfWeek : null,
      recurrenceDayOfMonth: formData.isRecurring && formData.recurrencePattern === "monthly" ? formData.recurrenceDayOfMonth : null,
      recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : null,
      recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate).toISOString() : null,
    });
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevDay = () => setCurrentDate(subDays(currentDate, 1));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  // Get dates for current view
  const calendarDays = view === "month"
    ? eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    : view === "week"
    ? weekDays
    : [dayDate];
  
  // Get events for current view dates
  const getEventsForView = (day: Date) => {
    const dayEvents = events.filter(event =>
      isSameDay(new Date(event.start), day)
    );
    
    if (eventTypeFilter === "all") return dayEvents;
    if (eventTypeFilter === "task") return [];
    return dayEvents.filter(event => event.type === eventTypeFilter);
  };
  
  // Get tasks for current view dates
  const getTasksForView = (day: Date): CalendarTask[] => {
    if (!showTasks) return [];
    return calendarTasks.filter(task =>
      task.dueDate && isSameDay(new Date(task.dueDate), day)
    );
  };
  
  // Get current view title
  const viewTitle = view === "month"
    ? format(currentDate, "MMMM yyyy")
    : view === "week"
    ? `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
    : format(dayDate, "EEEE, MMMM d, yyyy");

  // Get tasks for a specific day
  const getTasksForDay = (day: Date): CalendarTask[] => {
    if (!showTasks) return [];
    return calendarTasks.filter(task =>
      task.dueDate && isSameDay(new Date(task.dueDate), day)
    );
  };

  const getEventsForDay = (day: Date) => {
    const dayEvents = events.filter(event =>
      isSameDay(new Date(event.start), day)
    );

    // Apply filter
    if (eventTypeFilter === "all") return dayEvents;
    if (eventTypeFilter === "task") return []; // tasks shown separately
    return dayEvents.filter(event => event.type === eventTypeFilter);
  };

  const getEventColor = (type: string) => {
    return EVENT_TYPE_CONFIG[type as keyof typeof EVENT_TYPE_CONFIG]?.color || "bg-gray-500";
  };

  const getEventIcon = (type: string) => {
    return EVENT_TYPE_CONFIG[type as keyof typeof EVENT_TYPE_CONFIG]?.emoji || "📅";
  };

  const todayEvents = events.filter(event =>
    isSameDay(new Date(event.start), new Date())
  );

  const todayTasks = calendarTasks.filter(task =>
    task.dueDate && isSameDay(new Date(task.dueDate), new Date())
  );

  const upcomingEvents = events
    .filter(event => new Date(event.start) > new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 10);

  const upcomingTasks = calendarTasks
    .filter(task => task.dueDate && new Date(task.dueDate) > new Date() && task.status !== "completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10);

  const upcomingWithin48Hours = upcomingEvents.filter(event =>
    differenceInHours(new Date(event.start), new Date()) <= 48
  );

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
    setIsEditMode(false);
  };

  const handleTaskClick = (task: CalendarTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    setIsEditMode(true);
    setFormData({
      title: selectedEvent.title,
      description: selectedEvent.description || "",
      start: format(new Date(selectedEvent.start), "yyyy-MM-dd'T'HH:mm"),
      end: format(new Date(selectedEvent.end), "yyyy-MM-dd'T'HH:mm"),
      location: selectedEvent.location || "",
      type: selectedEvent.type,
      syncWithGoogle: false,
      // Recurrence fields
      isRecurring: selectedEvent.isRecurring || false,
      recurrencePattern: selectedEvent.recurrencePattern || "daily",
      recurrenceDaysOfWeek: selectedEvent.recurrenceDaysOfWeek || [],
      recurrenceDayOfMonth: selectedEvent.recurrenceDayOfMonth || 1,
      recurrenceInterval: selectedEvent.recurrenceInterval || 1,
      recurrenceEndDate: selectedEvent.recurrenceEndDate ? format(new Date(selectedEvent.recurrenceEndDate), "yyyy-MM-dd") : "",
    });
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent) return;

    if (!formData.title || !formData.start || !formData.end) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateEventMutation.mutate({
      id: selectedEvent.id,
      data: {
        title: formData.title,
        description: formData.description || null,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        location: formData.location || null,
        type: formData.type,
        // Recurrence fields
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
        recurrenceDaysOfWeek: formData.isRecurring && formData.recurrencePattern === "weekly" ? formData.recurrenceDaysOfWeek : null,
        recurrenceDayOfMonth: formData.isRecurring && formData.recurrencePattern === "monthly" ? formData.recurrenceDayOfMonth : null,
        recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : null,
        recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate).toISOString() : null,
      },
    });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    deleteEventMutation.mutate(selectedEvent.id);
  };

  const handleManualSync = async () => {
    toast({
      title: "🔄 Syncing...",
      description: "Refreshing calendar data from Google",
    });
    await queryClient.invalidateQueries({ queryKey: [eventsQueryUrl] });
    setLastSyncTime(new Date());
    toast({
      title: "✅ Synced!",
      description: "Calendar is up to date",
    });
  };

  const handleGoogleSync = () => {
    // Connect Outlook (Microsoft) account; callback will redirect back here.
    window.location.href = resolveApiUrl("/api/auth/microsoft?redirect=/company-calendar");
  };

  const filteredUpcomingEvents = eventTypeFilter === "all" 
    ? upcomingEvents 
    : upcomingEvents.filter(e => e.type === eventTypeFilter);

  return (
    <TooltipProvider>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-x-hidden">
        {/* Header with Gradient */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent border border-border/50">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gradient-purple">Company Calendar</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage team schedules and events</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showTasks ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowTasks(!showTasks)}
                  className={showTasks ? "bg-teal-500 hover:bg-teal-600 text-white" : ""}
                >
                  <ListTodo className="w-4 h-4 mr-2" />
                  Tasks {showTasks ? "On" : "Off"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showTasks ? "Hide tasks from calendar" : "Show tasks on calendar"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure calendar preferences</p>
              </TooltipContent>
            </Tooltip>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                  <Plus className="w-4 h-4" />
                  New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Calendar Event</DialogTitle>
                  <DialogDescription>Add a new event to the company calendar</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Event Title *</Label>
                    <Input 
                      placeholder="Team meeting, Client call, etc."
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date & Time *</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.start}
                        onChange={(e) => setFormData({...formData, start: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>End Date & Time *</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.end}
                        onChange={(e) => setFormData({...formData, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Event Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">👥 Meeting</SelectItem>
                        <SelectItem value="call">📞 Call</SelectItem>
                        <SelectItem value="deadline">🚨 Deadline</SelectItem>
                        <SelectItem value="reminder">⏰ Reminder</SelectItem>
                        <SelectItem value="event">🎉 Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Event details..." 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input 
                      placeholder="Office, Zoom, etc."
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Add to Google Calendar</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="google-sync"
                        checked={formData.syncWithGoogle}
                        onChange={(e) => setFormData({...formData, syncWithGoogle: e.target.checked})}
                      />
                      <label htmlFor="google-sync" className="text-sm">
                        Sync with Google Calendar
                      </label>
                    </div>
                  </div>

                  {/* Recurrence Section */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-recurring"
                        checked={formData.isRecurring}
                        onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                      />
                      <label htmlFor="is-recurring" className="text-sm font-medium cursor-pointer">
                        Recurring Event
                      </label>
                    </div>

                    {formData.isRecurring && (
                      <div className="space-y-4">
                        {/* Recurrence Pattern */}
                        <div>
                          <Label>Repeat</Label>
                          <Select
                            value={formData.recurrencePattern || "weekly"}
                            onValueChange={(value) => setFormData({...formData, recurrencePattern: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Interval */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Every</Label>
                            <Input
                              type="number"
                              min="1"
                              max="52"
                              value={formData.recurrenceInterval || 1}
                              onChange={(e) => setFormData({...formData, recurrenceInterval: parseInt(e.target.value) || 1})}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label>
                              {formData.recurrencePattern === "daily" ? "day(s)" :
                               formData.recurrencePattern === "weekly" ? "week(s)" : "month(s)"}
                            </Label>
                          </div>
                        </div>

                        {/* Pattern-specific controls */}
                        {formData.recurrencePattern === "weekly" && (
                          <div>
                            <Label>Repeat on</Label>
                            <div className="grid grid-cols-7 gap-2">
                              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                                <label key={day} className="flex items-center gap-2 cursor-pointer text-sm">
                                  <input
                                    type="checkbox"
                                    checked={(formData.recurrenceDaysOfWeek || []).includes(index)}
                                    onChange={(e) => {
                                      const days = formData.recurrenceDaysOfWeek || [];
                                      if (e.target.checked) {
                                        setFormData({...formData, recurrenceDaysOfWeek: [...days, index]});
                                      } else {
                                        setFormData({...formData, recurrenceDaysOfWeek: days.filter(d => d !== index)});
                                      }
                                    }}
                                  />
                                  {day}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.recurrencePattern === "monthly" && (
                          <div>
                            <Label>Day of Month</Label>
                            <Select
                              value={formData.recurrenceDayOfMonth?.toString() || ""}
                              onValueChange={(value) => setFormData({...formData, recurrenceDayOfMonth: parseInt(value) || 1})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                  <SelectItem key={day} value={day.toString()}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* End Date */}
                        <div>
                          <Label>End Date (Optional)</Label>
                          <Input
                            type="date"
                            value={formData.recurrenceEndDate ? formData.recurrenceEndDate.split('T')[0] : ""}
                            onChange={(e) => setFormData({...formData, recurrenceEndDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent} disabled={createEventMutation.isPending}>
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* View/Edit Event Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Event" : "Event Details"}</DialogTitle>
                  <DialogDescription>
                    {isEditMode ? "Update event information" : "View event details"}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedEvent && !isEditMode ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <span className="text-2xl">{getEventIcon(selectedEvent.type)}</span>
                        {selectedEvent.title}
                      </h3>
                      <Badge className={getEventColor(selectedEvent.type)}>
                        {selectedEvent.type}
                      </Badge>
                    </div>
                    
                    {selectedEvent.description && (
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedEvent.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start</Label>
                        <p className="text-sm mt-1">{format(new Date(selectedEvent.start), "PPp")}</p>
                      </div>
                      <div>
                        <Label>End</Label>
                        <p className="text-sm mt-1">{format(new Date(selectedEvent.end), "PPp")}</p>
                      </div>
                    </div>
                    
                    {selectedEvent.location && (
                      <div>
                        <Label>Location</Label>
                        <p className="text-sm mt-1">{selectedEvent.location}</p>
                      </div>
                    )}
                    
                    {/* Recurrence Information */}
                    {selectedEvent.isRecurring && (
                      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                          <Repeat className="w-4 h-4" />
                          <span className="font-semibold">Recurring Event</span>
                        </div>
                        <p className="text-sm mt-2 text-purple-600 dark:text-purple-400">
                          {selectedEvent.recurrencePattern === "daily" && `Every ${selectedEvent.recurrenceInterval || 1} day(s)`}
                          {selectedEvent.recurrencePattern === "weekly" && `Every ${selectedEvent.recurrenceInterval || 1} week(s) on ${selectedEvent.recurrenceDaysOfWeek?.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}`}
                          {selectedEvent.recurrencePattern === "monthly" && `Every ${selectedEvent.recurrenceInterval || 1} month(s) on day ${selectedEvent.recurrenceDayOfMonth}`}
                        </p>
                        {selectedEvent.recurrenceEndDate && (
                          <p className="text-xs mt-1 text-purple-500 dark:text-purple-400">
                            Until {format(new Date(selectedEvent.recurrenceEndDate), "PPP")}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between gap-2 pt-4 border-t">
                      <Button variant="destructive" onClick={handleDeleteEvent} disabled={deleteEventMutation.isPending}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                          Close
                        </Button>
                        <Button onClick={handleEditEvent}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : isEditMode && selectedEvent ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Event Title *</Label>
                      <Input 
                        placeholder="Team meeting, Client call, etc."
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date & Time *</Label>
                        <Input 
                          type="datetime-local"
                          value={formData.start}
                          onChange={(e) => setFormData({...formData, start: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>End Date & Time *</Label>
                        <Input 
                          type="datetime-local"
                          value={formData.end}
                          onChange={(e) => setFormData({...formData, end: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Event Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">👥 Meeting</SelectItem>
                          <SelectItem value="call">📞 Call</SelectItem>
                          <SelectItem value="deadline">🚨 Deadline</SelectItem>
                          <SelectItem value="reminder">⏰ Reminder</SelectItem>
                          <SelectItem value="event">🎉 Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Event details..." 
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        placeholder="Office, Zoom, etc."
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                    
                    {/* Recurrence Settings */}
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-is-recurring"
                          checked={formData.isRecurring}
                          onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked as boolean})}
                        />
                        <Label htmlFor="edit-is-recurring" className="cursor-pointer">
                          This is a recurring event
                        </Label>
                      </div>
                      
                      {formData.isRecurring && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Repeat Pattern</Label>
                              <Select
                                value={formData.recurrencePattern}
                                onValueChange={(value) => setFormData({...formData, recurrencePattern: value as any})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pattern" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Every</Label>
                              <Input
                                type="number"
                                min="1"
                                max="52"
                                value={formData.recurrenceInterval || 1}
                                onChange={(e) => setFormData({...formData, recurrenceInterval: parseInt(e.target.value) || 1})}
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* Pattern-specific controls */}
                          {formData.recurrencePattern === "weekly" && (
                            <div>
                              <Label>Repeat on</Label>
                              <div className="grid grid-cols-7 gap-2">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                                  <label key={day} className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                      type="checkbox"
                                      checked={(formData.recurrenceDaysOfWeek || []).includes(index)}
                                      onChange={(e) => {
                                        const days = formData.recurrenceDaysOfWeek || [];
                                        if (e.target.checked) {
                                          setFormData({...formData, recurrenceDaysOfWeek: [...days, index]});
                                        } else {
                                          setFormData({...formData, recurrenceDaysOfWeek: days.filter(d => d !== index)});
                                        }
                                      }}
                                    />
                                    {day}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {formData.recurrencePattern === "monthly" && (
                            <div>
                              <Label>Day of Month</Label>
                              <Select
                                value={formData.recurrenceDayOfMonth?.toString() || ""}
                                onValueChange={(value) => setFormData({...formData, recurrenceDayOfMonth: parseInt(value) || 1})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                    <SelectItem key={day} value={day.toString()}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* End Date */}
                          <div>
                            <Label>End Date (Optional)</Label>
                            <Input
                              type="date"
                              value={formData.recurrenceEndDate ? formData.recurrenceEndDate.split('T')[0] : ""}
                              onChange={(e) => setFormData({...formData, recurrenceEndDate: e.target.value})}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEditMode(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateEvent} disabled={updateEventMutation.isPending}>
                        {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Task Detail Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
              <DialogDescription>View task information</DialogDescription>
            </DialogHeader>
            {selectedTask && (() => {
              const statusInfo = STATUS_CONFIG[selectedTask.status] || STATUS_CONFIG.todo;
              const StatusIcon = statusInfo.icon;
              const priorityInfo = PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.normal;
              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-teal-500" />
                      {selectedTask.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-teal-500 text-white">Task</Badge>
                      <Badge variant="outline" className={`${statusInfo.color} border-current`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Badge className={`${priorityInfo.color} text-white`}>
                        {priorityInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {selectedTask.description && (
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Due Date</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(selectedTask.dueDate), "PPP")}
                      </p>
                    </div>
                    {selectedTask.estimatedHours && selectedTask.estimatedHours > 0 && (
                      <div>
                        <Label>Estimated Hours</Label>
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {selectedTask.estimatedHours}h
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTask.completedAt && (
                    <div>
                      <Label>Completed</Label>
                      <p className="text-sm mt-1 text-green-600">
                        {format(new Date(selectedTask.completedAt), "PPp")}
                      </p>
                    </div>
                  )}

                  {selectedTask.status !== "completed" && selectedTask.dueDate && isPast(new Date(selectedTask.dueDate)) && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-semibold text-sm">Overdue</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsTaskDialogOpen(false);
                        window.location.href = "/tasks";
                      }}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      Open in Tasks
                    </Button>
                    <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Enhanced Stats Cards with Dynamic Colors & Tooltips */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={`hover-elevate transition-all duration-300 cursor-pointer ${
                (todayEvents.length + todayTasks.length) > 0 ? 'border-emerald-500/50 bg-emerald-500/5' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today</p>
                      <p className={`text-2xl font-bold ${(todayEvents.length + todayTasks.length) > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        {todayEvents.length + todayTasks.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""}{todayTasks.length > 0 && ` + ${todayTasks.length} task${todayTasks.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${(todayEvents.length + todayTasks.length) > 0 ? 'bg-emerald-500/20' : 'bg-blue-500/10'}`}>
                      <CalendarIcon className={`w-6 h-6 ${(todayEvents.length + todayTasks.length) > 0 ? 'text-emerald-500' : 'text-blue-500'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Events and tasks scheduled for today</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={`hover-elevate transition-all duration-300 cursor-pointer ${
                calendarTasks.length > 0 && showTasks ? 'border-teal-500/50 bg-teal-500/5' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tasks Due</p>
                      <p className={`text-2xl font-bold ${calendarTasks.length > 0 && showTasks ? 'text-teal-600 dark:text-teal-400' : ''}`}>
                        {calendarTasks.filter(t => t.status !== "completed").length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {calendarTasks.filter(t => t.status === "completed").length} completed
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${calendarTasks.length > 0 && showTasks ? 'bg-teal-500/20' : 'bg-green-500/10'}`}>
                      <CheckSquare className={`w-6 h-6 ${calendarTasks.length > 0 && showTasks ? 'text-teal-500' : 'text-green-500'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tasks with due dates shown on calendar</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={`hover-elevate transition-all duration-300 cursor-pointer ${
                upcomingWithin48Hours.length > 0 ? 'border-orange-500/50 bg-orange-500/5' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                      <p className={`text-2xl font-bold ${upcomingWithin48Hours.length > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                        {upcomingEvents.length}
                      </p>
                      {upcomingWithin48Hours.length > 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{upcomingWithin48Hours.length} within 48h ⚡</p>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${upcomingWithin48Hours.length > 0 ? 'bg-orange-500/20' : 'bg-purple-500/10'}`}>
                      <Users className={`w-6 h-6 ${upcomingWithin48Hours.length > 0 ? 'text-orange-500' : 'text-purple-500'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Events due within 48 hours turn orange</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={`hover-elevate transition-all duration-300 cursor-pointer ${
                calendarConnection?.connected ? "border-emerald-500/50 bg-emerald-500/5" : ""
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Outlook Sync</p>
                      {calendarConnection?.connected ? (
                        <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1">
                          Connected ✓
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-muted-foreground">
                          Not connected
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(lastSyncTime, "h:mm a")}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="p-3 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20"
                      onClick={handleManualSync}
                      disabled={!calendarConnection?.connected}
                    >
                      <RefreshCw className="w-6 h-6 text-emerald-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {calendarConnection?.connected
                  ? `Connected as ${calendarConnection.email || "Outlook account"}`
                  : "Connect your Outlook account to show real events"}
                <br />
                Last synced: {format(lastSyncTime, "PPp")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar View */}
          <Card className="lg:col-span-8 shadow-xl border-0 glass-strong">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={prevMonth} 
                      className="h-8 w-8 hover:scale-110 transition-transform"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg sm:text-xl font-semibold min-w-[160px] text-center">
                      {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={nextMonth} 
                      className="h-8 w-8 hover:scale-110 transition-transform"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToToday} 
                    className="h-8 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Today
                  </Button>
                </div>
                <Tabs value={view} onValueChange={(v) => setView(v as any)} className="self-start sm:self-auto">
                  <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                    <TabsTrigger value="month" className="text-xs sm:text-sm">Month</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs sm:text-sm">Week</TabsTrigger>
                    <TabsTrigger value="day" className="text-xs sm:text-sm">Day</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* View-specific navigation */}
                {view === "month" && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">{viewTitle}</h2>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {view === "week" && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevWeek} className="h-8 w-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">{viewTitle}</h2>
                    <Button variant="outline" size="icon" onClick={nextWeek} className="h-8 w-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {view === "day" && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevDay} className="h-8 w-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">{viewTitle}</h2>
                    <Button variant="outline" size="icon" onClick={nextDay} className="h-8 w-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {/* Calendar Grid */}
              {view === "month" ? (
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {/* Day Headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <div key={day} className="text-center text-[10px] md:text-sm font-semibold text-muted-foreground py-1 md:py-2">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.slice(0, 1)}</span>
                    </div>
                  ))}
                  
                  {/* Calendar Days */}
                  {calendarDays.map((day, idx) => {
                    const dayEvents = getEventsForView(day);
                    const dayTasks = getTasksForView(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    const totalItems = dayEvents.length + dayTasks.length;
                    const hasItems = totalItems > 0;
                    const maxVisible = 3;

                    return (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => setSelectedDate(day)}
                            className={`
                              min-h-[60px] md:min-h-[100px] p-1 md:p-2 border rounded-md md:rounded-lg cursor-pointer transition-all duration-300
                              ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "hover:bg-accent hover:shadow-md"}
                              ${isSelected ? "ring-1 md:ring-2 ring-primary shadow-lg" : ""}
                              ${isTodayDate ? "bg-primary/10 border-primary border-2 shadow-md" : ""}
                              ${hasItems && !isTodayDate ? "border-purple-500/30" : ""}
                            `}
                          >
                            <div className={`text-[10px] md:text-sm font-semibold mb-0.5 md:mb-1 flex items-center justify-between ${isTodayDate ? "text-primary" : ""}`}>
                              <span>{format(day, "d")}</span>
                              {/* Indicator Dots */}
                              {hasItems && (
                                <div className="flex gap-0.5">
                                  {dayEvents.slice(0, 2).map((event, i) => (
                                    <div
                                      key={`e-${i}`}
                                      className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`}
                                    />
                                  ))}
                                  {dayTasks.length > 0 && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="space-y-0.5 md:space-y-1 max-h-[80px] md:max-h-[120px] overflow-y-auto">
                              {/* Events */}
                              {dayEvents.slice(0, maxVisible).map((event, eventIdx) => (
                                <Tooltip key={event.id}>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => handleEventClick(event, e)}
                                      className={`text-[8px] md:text-xs p-0.5 md:p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-all hover:scale-105 ${getEventColor(event.type)} mb-0.5 shadow-sm`}
                                      style={{
                                        position: 'relative',
                                        zIndex: totalItems - eventIdx,
                                      }}
                                    >
                                      <span className="mr-1">{getEventIcon(event.type)}</span>
                                      {event.title}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{event.title}</p>
                                    <p className="text-xs">{format(new Date(event.start), "h:mm a")}</p>
                                    {event.location && <p className="text-xs">📍 {event.location}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {/* Tasks */}
                              {dayTasks.slice(0, Math.max(0, maxVisible - dayEvents.length)).map((task) => (
                                <Tooltip key={`task-${task.id}`}>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => handleTaskClick(task, e)}
                                      className={`text-[8px] md:text-xs p-0.5 md:p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-all hover:scale-105 bg-teal-500 mb-0.5 shadow-sm ${
                                        task.status === "completed" ? "opacity-60 line-through" : ""
                                      }`}
                                    >
                                      <span className="mr-1">✅</span>
                                      {task.title}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{task.title}</p>
                                    <p className="text-xs capitalize">{task.status.replace("_", " ")} | {task.priority}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {totalItems > maxVisible && (
                                <div className="text-[8px] md:text-xs text-muted-foreground font-medium">
                                  +{totalItems - maxVisible} more
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(day, "EEEE, MMMM d")}</p>
                          {dayEvents.length > 0 && <p className="text-xs">{dayEvents.length} event(s)</p>}
                          {dayTasks.length > 0 && <p className="text-xs">{dayTasks.length} task(s)</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ) : view === "week" ? (
                <div className="space-y-4">
                  {/* Week Header */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevWeek}
                      className="h-8 w-8 hover:scale-110 transition-transform"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">{viewTitle}</h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextWeek}
                      className="h-8 w-8 hover:scale-110 transition-transform"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Week Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const dayEvents = getEventsForView(day);
                      const dayTasks = getTasksForView(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);
                      const totalItems = dayEvents.length + dayTasks.length;
                      const hasItems = totalItems > 0;
                      const maxVisible = 3;

                      return (
                        <Tooltip key={day.toISOString()}>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => setSelectedDate(day)}
                              className={`
                                min-h-[80px] md:min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all duration-300
                                ${isSelected ? "ring-2 ring-primary shadow-lg" : ""}
                                ${isTodayDate ? "bg-primary/10 border-primary border-2" : "hover:bg-accent"}
                                ${hasItems ? "border-purple-500/30" : ""}
                              `}
                            >
                              <div className={`text-sm font-semibold mb-2 flex items-center justify-between ${isTodayDate ? "text-primary" : ""}`}>
                                <span>{format(day, "EEE")}</span>
                                <span className={`text-sm ${isTodayDate ? "bg-primary text-white px-2 py-0.5 rounded-full" : ""}`}>
                                  {format(day, "d")}
                                </span>
                              </div>
                              <div className="space-y-1 max-h-[60px] overflow-y-auto">
                                {dayEvents.slice(0, maxVisible).map((event) => (
                                  <Tooltip key={event.id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEventClick(event, e);
                                        }}
                                        className={`text-xs p-1.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-all hover:scale-105 ${getEventColor(event.type)} shadow-sm`}
                                      >
                                        <span className="mr-1">{getEventIcon(event.type)}</span>
                                        {event.title}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-semibold">{event.title}</p>
                                      <p className="text-xs">{format(new Date(event.start), "h:mm a")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {dayTasks.slice(0, Math.max(0, maxVisible - dayEvents.length)).map((task) => (
                                  <Tooltip key={`task-${task.id}`}>
                                    <TooltipTrigger asChild>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTaskClick(task, e);
                                        }}
                                        className={`text-xs p-1.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-all hover:scale-105 bg-teal-500 shadow-sm ${
                                          task.status === "completed" ? "opacity-60 line-through" : ""
                                        }`}
                                      >
                                        <span className="mr-1">✅</span>
                                        {task.title}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-semibold">{task.title}</p>
                                      <p className="text-xs capitalize">{task.status.replace("_", " ")} | {task.priority}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {totalItems > maxVisible && (
                                  <div className="text-xs text-muted-foreground font-medium">
                                    +{totalItems - maxVisible} more
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(day, "EEEE, MMMM d, yyyy")}</p>
                            {dayEvents.length > 0 && <p className="text-xs">{dayEvents.length} event(s)</p>}
                            {dayTasks.length > 0 && <p className="text-xs">{dayTasks.length} task(s)</p>}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ) : view === "day" ? (
                <div className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevDay}
                      className="h-8 w-8 hover:scale-110 transition-transform"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">{viewTitle}</h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextDay}
                      className="h-8 w-8 hover:scale-110 transition-transform"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Day Events Timeline */}
                  <div className="space-y-2">
                    {dayDate && (
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                          {format(dayDate, "EEEE, MMMM d, yyyy")}
                        </h3>
                        
                        {/* Time Grid */}
                        <div className="space-y-1">
                          {Array.from({ length: 24 }, (_, hour) => {
                            const hourStart = setHours(dayDate, hour);
                            const hourEnd = setHours(dayDate, hour + 1);
                            const hourEvents = events.filter(event => {
                              const eventStart = new Date(event.start);
                              const eventEnd = new Date(event.end);
                              return eventStart < hourEnd && eventEnd > hourStart;
                            });
                            
                            return (
                              <div key={hour} className="flex gap-2">
                                <div className="w-16 text-xs text-muted-foreground text-right pr-2">
                                  {format(hourStart, "h:mm a")}
                                </div>
                                <div className="flex-1 border-t border-border/50 relative min-h-[40px]">
                                  {hourEvents.map((event) => (
                                    <Tooltip key={event.id}>
                                      <TooltipTrigger asChild>
                                        <div
                                          onClick={(e) => handleEventClick(event, e)}
                                          className={`absolute left-0 right-0 p-2 rounded text-white truncate cursor-pointer hover:opacity-80 transition-all hover:scale-105 ${getEventColor(event.type)} shadow-sm`}
                                          style={{
                                            top: `${(eventStart.getTime() - hourStart.getTime()) / (hourEnd.getTime() - hourStart.getTime()) * 100}%`,
                                            height: `${Math.max(30, (eventEnd.getTime() - eventStart.getTime()) / (hourEnd.getTime() - hourStart.getTime()) * 100)}%`,
                                          }}
                                        >
                                          <span className="mr-1">{getEventIcon(event.type)}</span>
                                          {event.title}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="font-semibold">{event.title}</p>
                                        <p className="text-xs">{format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}</p>
                                        {event.location && <p className="text-xs">📍 {event.location}</p>}
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Enhanced Upcoming Events & Tasks Sidebar */}
          <Card className="lg:col-span-4 shadow-xl border-0 glass-strong">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Upcoming</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Event Type Filter */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Button
                  size="sm"
                  variant={eventTypeFilter === "all" ? "default" : "outline"}
                  onClick={() => setEventTypeFilter("all")}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                {Object.entries(EVENT_TYPE_CONFIG).filter(([type]) => type !== "task").map(([type, config]) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={eventTypeFilter === type ? "default" : "outline"}
                    onClick={() => setEventTypeFilter(type)}
                    className="h-7 text-xs"
                  >
                    {config.emoji}
                  </Button>
                ))}
                {eventTypeFilter !== "all" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEventTypeFilter("all")}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading events...
                </div>
              ) : filteredUpcomingEvents.length === 0 && upcomingTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No upcoming events or tasks</p>
                  <p className="text-sm text-muted-foreground">
                    Create events or connect Outlook Calendar
                  </p>
                  <Button className="mt-4" onClick={handleGoogleSync} size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect Outlook Calendar
                  </Button>
                </div>
              ) : (
                <>
                  {/* Upcoming Events */}
                  {filteredUpcomingEvents.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Events</p>
                      {filteredUpcomingEvents.map((event) => {
                        const config = EVENT_TYPE_CONFIG[event.type];
                        const Icon = config.icon;
                        const hoursUntil = differenceInHours(new Date(event.start), new Date());
                        const isUrgent = hoursUntil <= 48;

                        return (
                          <Card
                            key={event.id}
                            className={`hover-elevate group cursor-pointer transition-all duration-300 ${
                              isUrgent ? 'border-orange-500/50 bg-orange-500/5' : ''
                            }`}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-5 h-5 ${config.textColor}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                                      {event.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(new Date(event.start), "MMM d, h:mm a")}
                                    </p>
                                    {isUrgent && (
                                      <Badge variant="secondary" className="mt-1 text-xs bg-orange-500/10 text-orange-600">
                                        {hoursUntil < 24 ? 'Due today' : 'Due soon'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEventClick(event, e);
                                      setIsEditMode(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </div>
                              )}
                              {event.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              {event.meetLink && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-2">
                                  <Video className="w-3 h-3 mr-1" />
                                  Join Meeting
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </>
                  )}

                  {/* Upcoming Tasks */}
                  {showTasks && upcomingTasks.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Tasks Due</p>
                      {upcomingTasks.map((task) => {
                        const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                        const StatusIcon = statusInfo.icon;
                        const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;
                        const hoursUntil = differenceInHours(new Date(task.dueDate), new Date());
                        const isUrgent = hoursUntil <= 48;
                        const isOverdue = isPast(new Date(task.dueDate));

                        return (
                          <Card
                            key={`sidebar-task-${task.id}`}
                            className={`hover-elevate group cursor-pointer transition-all duration-300 ${
                              isOverdue ? 'border-red-500/50 bg-red-500/5' : isUrgent ? 'border-orange-500/50 bg-orange-500/5' : 'border-teal-500/30'
                            }`}
                            onClick={(e) => handleTaskClick(task, e)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                  <CheckSquare className="w-5 h-5 text-teal-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm mb-1 group-hover:text-teal-600 transition-colors">
                                    {task.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    Due {format(new Date(task.dueDate), "MMM d")}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusInfo.color} border-current`}>
                                      <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                                      {statusInfo.label}
                                    </Badge>
                                    <Badge className={`text-[10px] px-1.5 py-0 text-white ${priorityInfo.color}`}>
                                      {priorityInfo.label}
                                    </Badge>
                                    {isOverdue && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600">
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
