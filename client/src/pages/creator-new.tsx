import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft } from "lucide-react";

export default function CreatorNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    homeCity: "",
    baseZip: "",
    serviceZipCodes: "",
    serviceRadiusMiles: "",
    ratePerVisitCents: "7500",
    availabilityNotes: "",
    status: "active",
    performanceScore: "5.0",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        homeCity: form.homeCity.trim() || null,
        baseZip: form.baseZip.trim() || null,
        serviceZipCodes: form.serviceZipCodes.trim()
          ? form.serviceZipCodes.split(",").map((z) => z.trim()).filter(Boolean)
          : null,
        serviceRadiusMiles: form.serviceRadiusMiles.trim() ? Number(form.serviceRadiusMiles) : null,
        ratePerVisitCents: Number(form.ratePerVisitCents),
        availabilityNotes: form.availabilityNotes.trim() || null,
        status: form.status as any,
        performanceScore: form.performanceScore.trim() ? Number(form.performanceScore) : null,
        notes: form.notes.trim() || null,
      };
      const res = await apiRequest("POST", "/api/creators", payload);
      return await res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/creators"] });
      toast({ title: "Creator created" });
      setLocation(`/creators/${created.id}`);
    },
    onError: (e: any) => {
      toast({ title: "Failed to create creator", description: e?.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/creators")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>New Creator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rate / Visit (cents) *</Label>
                <Input
                  type="number"
                  value={form.ratePerVisitCents}
                  onChange={(e) => setForm({ ...form, ratePerVisitCents: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Home City</Label>
                <Input value={form.homeCity} onChange={(e) => setForm({ ...form, homeCity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Base Zip</Label>
                <Input value={form.baseZip} onChange={(e) => setForm({ ...form, baseZip: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Performance Score (1–5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.performanceScore}
                  onChange={(e) => setForm({ ...form, performanceScore: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Zip Codes (comma-separated)</Label>
                <Input value={form.serviceZipCodes} onChange={(e) => setForm({ ...form, serviceZipCodes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Service Radius Miles</Label>
                <Input
                  type="number"
                  value={form.serviceRadiusMiles}
                  onChange={(e) => setForm({ ...form, serviceRadiusMiles: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Availability Notes</Label>
              <Textarea value={form.availabilityNotes} onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLocation("/creators")}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.fullName.trim()}
              >
                {createMutation.isPending ? "Creating…" : "Create Creator"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





