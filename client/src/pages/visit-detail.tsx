import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, CheckCircle2, Upload, ShieldCheck, DollarSign, AlertTriangle, RefreshCw } from "lucide-react";

export default function VisitDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/visits/:id");
  const visitId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();

  const { data, isLoading } = useQuery<any>({
    queryKey: [`/api/visits/${visitId}`],
    enabled: !!visitId,
  });

  const visit = data?.visit;
  const client = data?.client;
  const creator = data?.creator;

  const [uploadLinksText, setUploadLinksText] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [qualityScore, setQualityScore] = useState<string>("5");
  const [revisionNotes, setRevisionNotes] = useState<string>("");

  const canReleasePayment = useMemo(() => {
    if (!visit) return false;
    return visit.status === "completed" && visit.uploadReceived === true && visit.approved === true && visit.paymentReleased !== true && visit.disputeStatus !== "pending";
  }, [visit]);

  const patchNotes = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/visits/${visitId}`, { notes: notes.trim() || null });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Failed to save", description: e?.message, variant: "destructive" }),
  });

  const completeVisit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/visits/${visitId}/complete`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({ title: "Visit marked completed (upload due in 24h)" });
    },
    onError: (e: any) => toast({ title: "Failed to complete visit", description: e?.message, variant: "destructive" }),
  });

  const recordUpload = useMutation({
    mutationFn: async () => {
      const links = uploadLinksText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const res = await apiRequest("POST", `/api/visits/${visitId}/upload`, { uploadLinks: links });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({ title: "Upload recorded" });
      setUploadLinksText("");
    },
    onError: (e: any) => toast({ title: "Failed to record upload", description: e?.message, variant: "destructive" }),
  });

  const approveVisit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/visits/${visitId}/approve`, {
        approved: true,
        qualityScore: qualityScore ? Number(qualityScore) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({ title: "Visit approved" });
    },
    onError: (e: any) => toast({ title: "Failed to approve", description: e?.message, variant: "destructive" }),
  });

  const releasePayment = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/visits/${visitId}/release-payment`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({ title: "Payment released" });
    },
    onError: (e: any) => toast({ title: "Failed to release payment", description: e?.message, variant: "destructive" }),
  });

  const requestRevision = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/visits/${visitId}/request-revision`, { revisionNotes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      toast({ title: "Revision requested" });
      setRevisionNotes("");
    },
    onError: (e: any) => toast({ title: "Failed to request revision", description: e?.message, variant: "destructive" }),
  });

  const updateDispute = useMutation({
    mutationFn: async (status: "pending" | "resolved" | "none") => {
      const res = await apiRequest("POST", `/api/visits/${visitId}/dispute`, { disputeStatus: status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      toast({ title: "Dispute status updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update dispute", description: e?.message, variant: "destructive" }),
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

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading…</div>
        ) : !visit ? (
          <div className="py-10 text-center text-muted-foreground">Visit not found.</div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    Visit • {new Date(visit.scheduledStart).toLocaleString()}
                    <div className="text-sm text-muted-foreground">
                      Client: {client?.name} • Creator: {creator?.fullName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={visit.uploadOverdue ? "destructive" : visit.status === "completed" ? "default" : "secondary"}>
                      {visit.uploadOverdue ? "Upload Overdue" : visit.status}
                    </Badge>
                    {visit.revisionRequested && (
                      <Badge variant="destructive" className="gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Revision Requested
                      </Badge>
                    )}
                    {visit.disputeStatus === "pending" && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Disputed
                      </Badge>
                    )}
                    <Badge variant={visit.paymentReleased ? "default" : "outline"}>
                      {visit.paymentReleased ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Upload</div>
                  <div className="text-sm">
                    {visit.uploadReceived ? "Received" : "Missing"}
                    {visit.uploadDueAt && !visit.uploadReceived && (
                      <div className="text-xs text-muted-foreground">Due: {new Date(visit.uploadDueAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Approval</div>
                  <div className="text-sm">{visit.approved ? "Approved" : "Not approved"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rate</div>
                  <div className="text-sm">${(Number(creator?.ratePerVisitCents || 0) / 100).toFixed(2)}</div>
                </div>
              </CardContent>
              {visit.revisionRequested && visit.revisionNotes && (
                <CardContent className="pt-0">
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-bold mb-1">
                      <RefreshCw className="h-4 w-4" />
                      Revision Requested
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300/80">{visit.revisionNotes}</p>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full"
                    variant="default"
                    disabled={visit.status === "completed" || completeVisit.isPending}
                    onClick={() => completeVisit.mutate()}
                  >
                    Mark Completed
                  </Button>

                  <div className="space-y-2">
                    <Label>Upload Links (one per line)</Label>
                    <Textarea value={uploadLinksText} onChange={(e) => setUploadLinksText(e.target.value)} rows={4} />
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={recordUpload.isPending || !uploadLinksText.trim()}
                      onClick={() => recordUpload.mutate()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Record Upload
                    </Button>
                  </div>

                  {/* Creator-only or Admin-only sections */}
                  {(user as any)?.role !== "creator" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Quality Score (1–5)</Label>
                          <Input type="number" min={1} max={5} value={qualityScore} onChange={(e) => setQualityScore(e.target.value)} />
                        </div>
                        <div className="flex items-end">
                          <Button className="w-full" variant="outline" disabled={approveVisit.isPending} onClick={() => approveVisit.mutate()}>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t">
                        <Label>Revision Requests</Label>
                        <Textarea 
                          placeholder="Specify what needs to be changed..." 
                          value={revisionNotes} 
                          onChange={(e) => setRevisionNotes(e.target.value)} 
                          rows={2} 
                        />
                        <Button 
                          className="w-full" 
                          variant="ghost" 
                          disabled={requestRevision.isPending || !revisionNotes.trim()} 
                          onClick={() => requestRevision.mutate()}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Revision
                        </Button>
                      </div>

                      {["admin", "manager"].includes((user as any)?.role) && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label>Dispute Management</Label>
                          <div className="flex gap-2">
                            {visit.disputeStatus !== "pending" ? (
                              <Button 
                                className="flex-1" 
                                variant="destructive" 
                                disabled={updateDispute.isPending} 
                                onClick={() => updateDispute.mutate("pending")}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Open Dispute
                              </Button>
                            ) : (
                              <Button 
                                className="flex-1" 
                                variant="outline" 
                                disabled={updateDispute.isPending} 
                                onClick={() => updateDispute.mutate("resolved")}
                              >
                                Resolve Dispute
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={!canReleasePayment || releasePayment.isPending || !["admin", "manager"].includes((user as any)?.role)}
                        onClick={() => releasePayment.mutate()}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Release Payment
                      </Button>

                      <div className="space-y-2">
                        <Label>Internal Notes</Label>
                        <Textarea defaultValue={visit.notes || ""} onChange={(e) => setNotes(e.target.value)} rows={3} />
                        <Button className="w-full" variant="secondary" disabled={patchNotes.isPending} onClick={() => patchNotes.mutate()}>
                          Save Notes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-amber-900 dark:text-amber-400">Creator View</p>
                        <p className="text-amber-700 dark:text-amber-500/80">Some management actions are restricted to administrators. Use the "Record Upload" section to submit your content.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Upload Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.isArray(visit.uploadLinks) && visit.uploadLinks.length > 0 ? (
                    visit.uploadLinks.map((l: string, idx: number) => (
                      <a key={idx} href={l} target="_blank" rel="noreferrer" className="block text-sm underline text-primary">
                        {l}
                      </a>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No uploads recorded yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}





