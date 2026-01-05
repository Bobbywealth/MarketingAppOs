import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2, 
  History,
  AlertCircle,
  PiggyBank,
  Wallet
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CreatorVisit, Creator } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreatorPayoutsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch creator profile
  const { data: creator } = useQuery<Creator>({
    queryKey: [`/api/creators/${user?.creatorId}`],
    enabled: !!user?.creatorId,
  });

  // Fetch visits for earnings history
  const { data: visits = [] } = useQuery<CreatorVisit[]>({
    queryKey: ["/api/visits", { creatorId: user?.creatorId }],
    enabled: !!user?.creatorId,
  });

  const [payoutMethod, setPayoutMethod] = useState<string>(creator?.payoutMethod || "");
  const [payoutDetails, setPayoutDetails] = useState<any>(creator?.payoutDetails || {});

  const updatePayoutMutation = useMutation({
    mutationFn: async (data: { payoutMethod: string, payoutDetails: any }) => {
      const res = await apiRequest("PATCH", "/api/creators/me/payout-info", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${user?.creatorId}`] });
      toast({
        title: "Payout Info Updated",
        description: "Your payment settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update payout info.",
        variant: "destructive",
      });
    }
  });

  const handleSavePayout = () => {
    updatePayoutMutation.mutate({ payoutMethod, payoutDetails });
  };

  const completedVisits = visits.filter(v => v.status === 'completed');
  const pendingPayments = completedVisits.filter(v => !v.paymentReleased);
  const paidVisits = completedVisits.filter(v => v.paymentReleased);

  const totalEarnedCents = completedVisits.reduce((sum, v) => sum + (creator?.ratePerVisitCents || 0), 0);
  const totalPaidCents = paidVisits.reduce((sum, v) => sum + (creator?.ratePerVisitCents || 0), 0);
  const totalPendingCents = pendingPayments.reduce((sum, v) => sum + (creator?.ratePerVisitCents || 0), 0);

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings & Payouts</h1>
          <p className="text-muted-foreground">Manage how you get paid and track your earnings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Lifetime Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(totalEarnedCents / 100).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(totalPaidCents / 100).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-amber-500" />
              Pending Release
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">${(totalPendingCents / 100).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payout Settings
            </CardTitle>
            <CardDescription>Choose your preferred payment method and provide details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Preferred Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="bank_transfer">Direct Deposit (ACH)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payoutMethod === "paypal" && (
              <div className="space-y-2">
                <Label>PayPal Email Address</Label>
                <Input 
                  type="email" 
                  placeholder="email@example.com" 
                  value={payoutDetails.email || ""} 
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, email: e.target.value })}
                />
              </div>
            )}

            {payoutMethod === "venmo" && (
              <div className="space-y-2">
                <Label>Venmo Username</Label>
                <Input 
                  placeholder="@username" 
                  value={payoutDetails.username || ""} 
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, username: e.target.value })}
                />
              </div>
            )}

            {payoutMethod === "zelle" && (
              <div className="space-y-2">
                <Label>Zelle Email or Phone</Label>
                <Input 
                  placeholder="Email or phone number" 
                  value={payoutDetails.id || ""} 
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, id: e.target.value })}
                />
              </div>
            )}

            {payoutMethod === "bank_transfer" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Routing Number</Label>
                  <Input 
                    placeholder="9-digit routing number" 
                    value={payoutDetails.routing || ""} 
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, routing: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    placeholder="Account number" 
                    value={payoutDetails.account || ""} 
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, account: e.target.value })}
                  />
                </div>
              </div>
            )}

            {payoutMethod && (
              <Button 
                className="w-full" 
                onClick={handleSavePayout}
                disabled={updatePayoutMutation.isPending}
              >
                {updatePayoutMutation.isPending ? "Saving..." : "Save Payout Information"}
              </Button>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-bold">Payment Schedule</p>
                <p>Payments are released within 48 hours of visit approval. Please ensure your details are accurate to avoid delays.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>Your payment history for completed visits.</CardDescription>
          </CardHeader>
          <CardContent>
            {completedVisits.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground italic">No payment history yet. Complete your first visit to start earning!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedVisits.slice(0, 10).map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm">
                    <div className="space-y-1">
                      <div className="font-bold text-sm">{(visit as any).clientName}</div>
                      <div className="text-[10px] text-muted-foreground">{format(new Date(visit.scheduledStart), 'MMM d, yyyy')}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold text-sm">${(creator?.ratePerVisitCents || 0) / 100}</div>
                      <Badge variant={visit.paymentReleased ? "default" : "outline"} className={visit.paymentReleased ? "bg-green-500 hover:bg-green-600 text-[10px]" : "text-[10px]"}>
                        {visit.paymentReleased ? "Paid" : "Pending Release"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

