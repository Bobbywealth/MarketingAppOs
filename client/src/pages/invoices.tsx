import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, TrendingUp, TrendingDown, Users, CreditCard, ExternalLink, RefreshCcw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface StripeDashboardData {
  activeSubscribers: number;
  mrr: number;
  grossVolume: number;
  totalRevenue: number;
  refundedAmount: number;
  newCustomers: number;
  totalPayouts: number;
  topCustomers: Array<{ id: string; name: string; email: string; total: number }>;
  paymentBreakdown: {
    succeeded: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  recentCharges: Array<{
    id: string;
    amount: number;
    currency: string;
    customerName: string;
    created: string;
    description: string;
  }>;
  recentPayouts: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: string;
    created: string;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

interface StripeCustomer {
  id: string;
  name: string;
  email: string;
}

export default function Invoices() {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<Array<{ description: string; amount: string }>>([
    { description: "", amount: "" }
  ]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  
  const { toast } = useToast();

  // Fetch Stripe dashboard metrics
  const { data: stripeData, isLoading, refetch } = useQuery<StripeDashboardData>({
    queryKey: ["/api/stripe/dashboard", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start.toISOString());
      if (dateRange.end) params.append('endDate', dateRange.end.toISOString());
      
      const response = await apiRequest("GET", `/api/stripe/dashboard?${params.toString()}`, undefined);
      return response.json();
    },
    retry: false,
  });

  // Fetch Stripe customers
  const { data: stripeCustomers } = useQuery<StripeCustomer[]>({
    queryKey: ["/api/stripe/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stripe/customers", undefined);
      return response.json();
    },
    retry: false,
  });

  // Fetch Stripe balance
  const { data: stripeBalance } = useQuery({
    queryKey: ["/api/stripe/balance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stripe/balance", undefined);
      return response.json();
    },
    retry: false,
  });

  const createStripeInvoiceMutation = useMutation({
    mutationFn: async (data: { customerId: string; items: Array<{ description: string; amount: number }> }) => {
      const response = await apiRequest("POST", "/api/stripe/invoices", data);
      return response.json();
    },
    onSuccess: (data) => {
      setInvoiceDialogOpen(false);
      setInvoiceItems([{ description: "", amount: "" }]);
      setSelectedCustomerId("");
      toast({ 
        title: "✅ Invoice created successfully!",
        description: "Invoice has been sent to the customer.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/dashboard"] });
      
      // Open invoice URL if available
      if (data.hostedInvoiceUrl) {
        window.open(data.hostedInvoiceUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create invoice", 
        description: error?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const handleCreateInvoice = () => {
    const validItems = invoiceItems
      .filter(item => item.description.trim() && item.amount.trim())
      .map(item => ({
        description: item.description,
        amount: parseFloat(item.amount),
      }));

    if (!selectedCustomerId) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }

    if (validItems.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    createStripeInvoiceMutation.mutate({
      customerId: selectedCustomerId,
      items: validItems,
    });
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: "", amount: "" }]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;
    setInvoiceItems(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh p-6 lg:p-8">
        <div className="space-y-6">
          <div className="h-12 bg-muted/50 rounded w-64 shimmer"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-24 bg-muted/50 rounded shimmer"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalInvoiceAmount = invoiceItems.reduce((sum, item) => {
    return sum + (parseFloat(item.amount) || 0);
  }, 0);

  return (
    <div className="min-h-full gradient-mesh p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">
            Invoices & Billing
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time Stripe analytics and payment management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Stripe Invoice</DialogTitle>
                <DialogDescription>
                  Create and send a new invoice to a customer
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {stripeCustomers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name || customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Invoice Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount ($)"
                        value={item.amount}
                        onChange={(e) => updateInvoiceItem(index, 'amount', e.target.value)}
                        className="w-32"
                      />
                      {invoiceItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {totalInvoiceAmount > 0 && (
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold">${totalInvoiceAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateInvoice}
                  disabled={createStripeInvoiceMutation.isPending}
                >
                  {createStripeInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stripeData?.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">${stripeData?.mrr?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground mt-1">Monthly Recurring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-bold">{stripeData?.activeSubscribers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Gross Volume</p>
                <p className="text-2xl font-bold">${stripeData?.grossVolume?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">New Customers</p>
                <p className="text-2xl font-bold">{stripeData?.newCustomers || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">This period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <ArrowDownRight className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold">${stripeData?.totalPayouts?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="text-2xl font-bold">${stripeData?.refundedAmount?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">
                  ${stripeBalance?.available?.[0]?.amount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Customers by Spend
            </CardTitle>
            <CardDescription>Highest paying customers this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stripeData?.topCustomers?.slice(0, 10).map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold">${customer.total.toFixed(2)}</p>
                </div>
              ))}
              {(!stripeData?.topCustomers || stripeData.topCustomers.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No customer data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Status Breakdown
            </CardTitle>
            <CardDescription>Overview of payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Succeeded</span>
                </div>
                <span className="text-2xl font-bold">{stripeData?.paymentBreakdown?.succeeded || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">Pending</span>
                </div>
                <span className="text-2xl font-bold">{stripeData?.paymentBreakdown?.pending || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-medium">Failed</span>
                </div>
                <span className="text-2xl font-bold">{stripeData?.paymentBreakdown?.failed || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="font-medium">Refunded</span>
                </div>
                <span className="text-2xl font-bold">{stripeData?.paymentBreakdown?.refunded || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Recent Charges
          </CardTitle>
          <CardDescription>Latest successful payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stripeData?.recentCharges?.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between p-4 rounded-lg hover-elevate">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                      <p className="font-medium">{charge.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {charge.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(charge.created), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${charge.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{charge.currency}</p>
                </div>
              </div>
            ))}
            {(!stripeData?.recentCharges || stripeData.recentCharges.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">No recent charges</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5" />
            Recent Payouts
          </CardTitle>
          <CardDescription>Money transferred to your bank account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stripeData?.recentPayouts?.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4 rounded-lg hover-elevate">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                      {payout.status}
                    </Badge>
                    <div>
                      <p className="text-sm">
                        Arrival: {new Date(payout.arrivalDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(new Date(payout.created), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${payout.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{payout.currency}</p>
                </div>
              </div>
            ))}
            {(!stripeData?.recentPayouts || stripeData.recentPayouts.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">No recent payouts</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stripe Dashboard Link */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">View Full Stripe Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Access detailed analytics, reports, and settings in your Stripe account
              </p>
            </div>
            <Button asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                Open Stripe
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
