import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Receipt, TrendingUp, Calendar, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function ClientBilling() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  
  // Fetch client's billing data
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  const { data: subscription } = useQuery<any>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  // Filter invoices for this client
  const clientInvoices = invoices.filter((invoice: any) => 
    invoice.clientId === user?.clientId
  );

  // Calculate totals
  const totalPaid = clientInvoices
    .filter((invoice: any) => invoice.status === 'paid')
    .reduce((sum: number, invoice: any) => sum + invoice.amount, 0);

  const pendingAmount = clientInvoices
    .filter((invoice: any) => invoice.status === 'sent' || invoice.status === 'overdue')
    .reduce((sum: number, invoice: any) => sum + invoice.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-600 border-green-200";
      case "sent": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "overdue": return "bg-red-500/10 text-red-600 border-red-200";
      case "draft": return "bg-gray-500/10 text-gray-600 border-gray-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'inactive', color: 'bg-gray-500/10 text-gray-600' };
    
    switch (subscription.status) {
      case 'active': return { status: 'Active', color: 'bg-green-500/10 text-green-600' };
      case 'past_due': return { status: 'Past Due', color: 'bg-red-500/10 text-red-600' };
      case 'canceled': return { status: 'Canceled', color: 'bg-gray-500/10 text-gray-600' };
      case 'trialing': return { status: 'Trial', color: 'bg-blue-500/10 text-blue-600' };
      default: return { status: 'Inactive', color: 'bg-gray-500/10 text-gray-600' };
    }
  };

  const subscriptionInfo = getSubscriptionStatus();

  return (
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-12 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple">
            Billing & Invoices
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Manage your subscription and view payment history
          </p>
        </div>

        {/* Billing Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Total Paid</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">${(totalPaid / 100).toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Pending</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">${(pendingAmount / 100).toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Invoices</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">{clientInvoices.length}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg">Paid</CardTitle>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                    {clientInvoices.filter((i: any) => i.status === 'paid').length}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Current Subscription */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Current Subscription</CardTitle>
                  <CardDescription>Your active plan and billing details</CardDescription>
                </div>
              </div>
              <Badge className={`${subscriptionInfo.color} border`}>
                {subscriptionInfo.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            {subscription ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold">{subscription.planName || 'Professional Plan'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">
                      ${subscription.amount ? (subscription.amount / 100).toLocaleString() : '0'}/month
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                    <p className="text-lg font-semibold">
                      {subscription.nextBillingDate ? 
                        format(new Date(subscription.nextBillingDate), 'MMM d, yyyy') : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
                
                {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Trial Period</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Your trial ends on {format(new Date(subscription.trialEnd), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Update Payment Method
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    View Billing History
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have an active subscription yet.
                </p>
                <Button>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Choose a Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Invoices</CardTitle>
                  <CardDescription>Your payment history and pending invoices</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            {clientInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientInvoices.slice(0, 10).map((invoice: any) => (
                  <div key={invoice.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{invoice.invoiceNumber}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {invoice.description || 'Monthly subscription'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-sm sm:text-base">${(invoice.amount / 100).toLocaleString()}</p>
                        <Badge className={`${getStatusColor(invoice.status)} border text-xs`}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
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
