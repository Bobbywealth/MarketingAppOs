import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Plus } from "lucide-react";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format } from "date-fns";

type VisitRow = {
  id: string;
  clientId: string;
  creatorId: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  uploadReceived: boolean;
  uploadOverdue: boolean;
  approved: boolean;
  paymentReleased: boolean;
  clientName: string;
  creatorName: string;
};

type ViewMode = "list" | "calendar";

export default function VisitsPage() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<ViewMode>("list");
  const [status, setStatus] = useState<string>("all");
  const [uploadOverdue, setUploadOverdue] = useState<string>("all");
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (uploadOverdue === "true") params.set("uploadOverdue", "true");
    // For calendar view, fetch the visible week range
    if (view === "calendar") {
      params.set("from", weekStart.toISOString());
      params.set("to", endOfWeek(weekStart, { weekStartsOn: 0 }).toISOString());
    }
    const qs = params.toString();
    return qs ? `/api/visits?${qs}` : "/api/visits";
  }, [status, uploadOverdue, view, weekStart]);

  const { data: visits = [], isLoading } = useQuery<VisitRow[]>({
    queryKey: [queryUrl],
  });

  const days = useMemo(() => {
    const end = endOfWeek(weekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end });
  }, [weekStart]);

  const visitsForDay = (day: Date) =>
    visits.filter((v) => isSameDay(new Date(v.scheduledStart), day));

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Visits</h1>
            <p className="text-muted-foreground">Schedule visits, track uploads, approve quality, and release payments.</p>
          </div>
          <Button onClick={() => setLocation("/visits/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Visit
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>View</Label>
              <Select value={view} onValueChange={(v) => setView(v as ViewMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="calendar">Calendar (week)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Uploads Overdue</Label>
              <Select value={uploadOverdue} onValueChange={setUploadOverdue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Only Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {view === "calendar" && (
              <div className="space-y-2">
                <Label>Week Of</Label>
                <Input
                  type="date"
                  value={format(weekStart, "yyyy-MM-dd")}
                  onChange={(e) => setWeekStart(startOfWeek(new Date(e.target.value), { weekStartsOn: 0 }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading visits…</div>
        ) : view === "list" ? (
          <Card>
            <CardHeader>
              <CardTitle>All Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => (
                    <TableRow key={v.id} className="cursor-pointer" onClick={() => setLocation(`/visits/${v.id}`)}>
                      <TableCell>
                        <div className="text-sm font-medium">{new Date(v.scheduledStart).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          → {new Date(v.scheduledEnd).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>{v.clientName}</TableCell>
                      <TableCell>{v.creatorName}</TableCell>
                      <TableCell>
                        <Badge variant={v.status === "completed" ? "default" : v.status === "scheduled" ? "secondary" : "outline"}>
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.uploadOverdue ? "destructive" : v.uploadReceived ? "default" : "outline"}>
                          {v.uploadOverdue ? "Overdue" : v.uploadReceived ? "Received" : "Missing"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.approved ? "default" : "outline"}>{v.approved ? "Approved" : "Not approved"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.paymentReleased ? "default" : "outline"}>{v.paymentReleased ? "Paid" : "Unpaid"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No visits found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {days.map((d) => {
              const dayVisits = visitsForDay(d);
              return (
                <Card key={d.toISOString()} className="min-h-[180px]">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">
                      {format(d, "EEE")}
                      <span className="text-muted-foreground"> • {format(d, "MMM d")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {dayVisits.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No visits</div>
                    ) : (
                      dayVisits.map((v) => (
                        <div
                          key={v.id}
                          className="p-2 rounded border bg-card cursor-pointer"
                          onClick={() => setLocation(`/visits/${v.id}`)}
                        >
                          <div className="text-xs font-medium">{v.clientName}</div>
                          <div className="text-[11px] text-muted-foreground">{v.creatorName}</div>
                          <div className="flex items-center gap-1 pt-1">
                            <Badge variant={v.uploadOverdue ? "destructive" : "secondary"} className="text-[10px]">
                              {v.uploadOverdue ? "Overdue" : v.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



