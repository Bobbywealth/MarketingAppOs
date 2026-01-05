import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar as CalendarIcon, Info, CheckCircle2, XCircle } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

type ClientRow = { id: string; name: string };
type CreatorRow = { 
  id: string; 
  fullName: string; 
  status: string; 
  availabilityNotes?: string | null;
  availability?: Record<string, "available" | "unavailable"> | null;
};

export default function VisitNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<ClientRow[]>({ queryKey: ["/api/clients"] });
  const { data: creators = [] } = useQuery<CreatorRow[]>({ queryKey: ["/api/creators"] });

  const [clientId, setClientId] = useState<string>("");
  const [creatorId, setCreatorId] = useState<string>("");
  const [scheduledStart, setScheduledStart] = useState<string>("");
  const [scheduledEnd, setScheduledEnd] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const selectedCreator = useMemo(() => creators.find(c => c.id === creatorId), [creators, creatorId]);
  
  const creatorAvailabilityStatus = useMemo(() => {
    if (!selectedCreator || !scheduledStart) return null;
    const dateStr = format(new Date(scheduledStart), "yyyy-MM-dd");
    return selectedCreator.availability?.[dateStr] || "unknown";
  }, [selectedCreator, scheduledStart]);

  const canSubmit = useMemo(() => !!clientId && !!creatorId && !!scheduledStart && !!scheduledEnd, [clientId, creatorId, scheduledStart, scheduledEnd]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/visits", {
        clientId,
        creatorId,
        scheduledStart: new Date(scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduledEnd).toISOString(),
        notes: notes.trim() || null,
      });
      return await res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({ title: "Visit scheduled" });
      setLocation(`/visits/${created.id}`);
    },
    onError: (e: any) => {
      toast({ title: "Failed to schedule visit", description: e?.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/visits")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>New Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Creator *</Label>
                <Select value={creatorId} onValueChange={setCreatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {creators
                      .filter((c) => c.status !== "inactive")
                      .map((c) => {
                        const dateStr = scheduledStart ? format(new Date(scheduledStart), "yyyy-MM-dd") : null;
                        const status = dateStr ? c.availability?.[dateStr] : null;
                        const statusLabel = status === "available" ? "🟢 Avail" : status === "unavailable" ? "🔴 Unavail" : "";
                        
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{c.fullName} ({c.status})</span>
                              {statusLabel && <span className="text-[10px] font-bold opacity-70">{statusLabel}</span>}
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Start *</Label>
                <Input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scheduled End *</Label>
                <Input type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} />
              </div>
            </div>

            {/* Creator Availability Preview */}
            {selectedCreator && (
              <div className="p-4 rounded-2xl border bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Creator Availability
                  </h3>
                  {scheduledStart && (
                    <div className="flex items-center gap-2">
                      {creatorAvailabilityStatus === "available" ? (
                        <Badge className="bg-green-500 hover:bg-green-600 border-0 gap-1 px-2 py-0.5 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Available on this date
                        </Badge>
                      ) : creatorAvailabilityStatus === "unavailable" ? (
                        <Badge variant="destructive" className="gap-1 px-2 py-0.5 text-[10px]">
                          <XCircle className="w-3 h-3" /> Unavailable on this date
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-[10px] text-muted-foreground">
                          <Info className="w-3 h-3" /> Not specified for this date
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedCreator.availabilityNotes && (
                  <div className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-100">
                    "{selectedCreator.availabilityNotes}"
                  </div>
                )}
                
                {!selectedCreator.availabilityNotes && !selectedCreator.availability && (
                  <p className="text-xs text-muted-foreground italic">No specific availability information provided by this creator.</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLocation("/visits")}>
                Cancel
              </Button>
              <Button disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? "Scheduling…" : "Schedule Visit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}








