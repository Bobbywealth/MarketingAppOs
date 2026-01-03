import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { CreatorVisit } from "@shared/schema";

type VisitRow = CreatorVisit & {
  clientName: string;
  creatorName: string;
};

export default function CreatorVisitsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: visits = [], isLoading } = useQuery<VisitRow[]>({
    queryKey: ["/api/visits", { creatorId: user?.creatorId }],
    enabled: !!user?.creatorId,
  });

  const filteredVisits = useMemo(() => {
    if (statusFilter === "all") return visits;
    return visits.filter(v => v.status === statusFilter);
  }, [visits, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: visits.length,
      upcoming: visits.filter(v => v.status === 'scheduled').length,
      completed: visits.filter(v => v.status === 'completed').length,
      pendingApproval: visits.filter(v => v.uploadReceived && !v.approved).length
    };
  }, [visits]);

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Visits</h1>
          <p className="text-muted-foreground">Manage your content creation schedule and uploads.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Visits", value: stats.total, icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
          { label: "Awaiting Approval", value: stats.pendingApproval, icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-100" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-full ${stat.bg} dark:bg-opacity-10 flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'scheduled', 'completed', 'missed', 'cancelled'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Visits List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading your visits...</div>
        ) : filteredVisits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No visits found matching the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredVisits.map((visit) => (
            <Card key={visit.id} className="group hover:border-primary/50 transition-all cursor-pointer" onClick={() => setLocation(`/visits/${visit.id}`)}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{visit.clientName}</h3>
                          <Badge variant={
                            visit.status === 'completed' ? 'default' : 
                            visit.status === 'scheduled' ? 'secondary' : 
                            'outline'
                          } className="capitalize">
                            {visit.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(visit.scheduledStart), 'EEE, MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {format(new Date(visit.scheduledStart), 'h:mm a')} - {format(new Date(visit.scheduledEnd), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant={visit.uploadReceived ? "default" : "outline"} className="gap-1.5">
                          {visit.uploadReceived ? <CheckCircle2 className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                          {visit.uploadReceived ? "Upload Received" : "Upload Pending"}
                        </Badge>
                        {visit.approved && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </Badge>
                        )}
                        {visit.paymentReleased && (
                          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                            Payment Released
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:border-l p-6 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
                    <Button variant="ghost" className="group-hover:text-primary gap-2">
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

