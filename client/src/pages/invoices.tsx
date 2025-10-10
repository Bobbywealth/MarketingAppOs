import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Invoice, Client } from "@shared/schema";

export default function Invoices() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setDialogOpen(false);
      toast({ title: "Invoice created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    },
  });

  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createInvoiceMutation.mutate({
      clientId: formData.get("clientId"),
      invoiceNumber: formData.get("invoiceNumber"),
      amount: parseInt(formData.get("amount") as string),
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null,
      description: formData.get("description"),
    });
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "paid": return "from-emerald-500 to-teal-500";
      case "sent": return "from-blue-500 to-cyan-500";
      case "overdue": return "from-red-500 to-orange-500";
      case "draft": return "from-slate-400 to-slate-500";
      default: return "from-slate-400 to-slate-500";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="p-6 lg:p-8 xl:p-12">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6 border-0 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted/50 rounded w-32 shimmer"></div>
                    <div className="h-4 bg-muted/50 rounded w-48 shimmer"></div>
                  </div>
                  <div className="h-8 bg-muted/50 rounded w-24 shimmer"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = invoices?.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const pendingAmount = invoices?.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + inv.amount, 0) || 0;

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Invoices & Billing</h1>
            <p className="text-lg text-muted-foreground">Manage invoices and track payments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-invoice">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Invoice</DialogTitle>
              <DialogDescription>Generate a new invoice for your client</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select name="clientId" required>
                    <SelectTrigger data-testid="select-invoice-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input id="invoiceNumber" name="invoiceNumber" placeholder="INV-001" required data-testid="input-invoice-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input id="amount" name="amount" type="number" required data-testid="input-amount" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" data-testid="input-due-date" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" data-testid="input-description" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createInvoiceMutation.isPending} data-testid="button-submit-invoice">
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-semibold">${(totalRevenue / 100).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-chart-1/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-semibold">${(pendingAmount / 100).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-chart-4/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-semibold">{invoices?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {invoices?.map((invoice) => (
          <Card key={invoice.id} className="hover-elevate transition-shadow" data-testid={`card-invoice-${invoice.id}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                    <Badge className={getStatusColor(invoice.status)} variant="secondary">
                      {invoice.status}
                    </Badge>
                  </div>
                  {invoice.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{invoice.description}</p>
                  )}
                  {invoice.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold">${(invoice.amount / 100).toLocaleString()}</p>
                  {invoice.paidAt && (
                    <p className="text-xs text-muted-foreground">
                      Paid: {new Date(invoice.paidAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No invoices yet</p>
        </div>
      )}
      </div>
    </div>
  );
}
