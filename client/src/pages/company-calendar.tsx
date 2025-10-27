import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ExternalLink
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";

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
}

export default function CompanyCalendarPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    location: "",
    type: "meeting",
    syncWithGoogle: false,
  });

  // Fetch calendar events from API
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return await apiRequest("POST", "/api/calendar/events", eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
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
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start), day)
    );
  };

  const getEventColor = (type: string) => {
    const colors = {
      meeting: "bg-blue-500",
      call: "bg-green-500",
      deadline: "bg-red-500",
      reminder: "bg-yellow-500",
      event: "bg-purple-500",
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  const todayEvents = events.filter(event => 
    isSameDay(new Date(event.start), new Date())
  );

  const upcomingEvents = events
    .filter(event => new Date(event.start) > new Date())
    .slice(0, 5);


  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
    setIsEditMode(false);
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
      },
    });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    deleteEventMutation.mutate(selectedEvent.id);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Company Calendar</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage team schedules and events</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
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
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
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
                    <h3 className="text-lg font-semibold mb-2">{selectedEvent.title}</h3>
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
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Events</p>
                <p className="text-2xl font-bold">{todayEvents.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Google Sync</p>
                <p className="text-sm font-semibold text-green-500">Connected</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <RefreshCw className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-xl font-semibold min-w-[200px] text-center">
                    {format(currentDate, "MMMM yyyy")}
                  </h2>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
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
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[60px] md:min-h-[100px] p-1 md:p-2 border rounded-md md:rounded-lg cursor-pointer transition-all
                      ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "hover:bg-accent"}
                      ${isSelected ? "ring-1 md:ring-2 ring-primary" : ""}
                      ${isTodayDate ? "bg-primary/5 border-primary" : ""}
                    `}
                  >
                    <div className={`text-[10px] md:text-sm font-semibold mb-0.5 md:mb-1 ${isTodayDate ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5 md:space-y-1 max-h-[80px] md:max-h-[120px] overflow-y-auto">
                      {dayEvents.slice(0, 3).map((event, eventIdx) => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-[8px] md:text-xs p-0.5 md:p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event.type)} mb-0.5`}
                          style={{
                            position: 'relative',
                            zIndex: dayEvents.length - eventIdx,
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[8px] md:text-xs text-muted-foreground font-medium">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading events...
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No upcoming events</p>
                <p className="text-sm text-muted-foreground">
                  Create events or sync with Google Calendar
                </p>
                <Button className="mt-4" onClick={handleGoogleSync}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Google Calendar
                </Button>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <Card key={event.id} className="hover-elevate group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${getEventColor(event.type)}`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    {event.meetLink && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-2">
                        <Video className="w-3 h-3 mr-1" />
                        Join Meeting
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

