import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  // Mock data - will be replaced with Google Calendar API
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events", currentDate.getMonth()],
    queryFn: async () => {
      // TODO: Replace with Google Calendar API
      return [];
    },
  });

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

  const handleGoogleSync = () => {
    toast({
      title: "🔄 Syncing with Google Calendar",
      description: "Please connect your Google account in settings"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Calendar</h1>
          <p className="text-muted-foreground">Manage team schedules and events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoogleSync}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Google Calendar
          </Button>
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
                  <Input placeholder="Team meeting, Client call, etc." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date & Time *</Label>
                    <Input type="datetime-local" />
                  </div>
                  <div>
                    <Label>End Date & Time *</Label>
                    <Input type="datetime-local" />
                  </div>
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Select>
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
                  <Textarea placeholder="Event details..." rows={3} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input placeholder="Office, Zoom, etc." />
                </div>
                <div>
                  <Label>Add to Google Calendar</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="google-sync" />
                    <label htmlFor="google-sync" className="text-sm">
                      Sync with Google Calendar
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Create Event</Button>
                </div>
              </div>
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
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
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
                      min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all
                      ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "hover:bg-accent"}
                      ${isSelected ? "ring-2 ring-primary" : ""}
                      ${isTodayDate ? "bg-primary/5 border-primary" : ""}
                    `}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isTodayDate ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded text-white truncate ${getEventColor(event.type)}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} more
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

