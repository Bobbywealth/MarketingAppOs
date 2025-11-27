import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, CheckCircle2, Clock, XCircle, Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Commission {
  id: number;
  agentId: number;
  agentName: string;
  leadId?: string;
  leadName?: string;
  clientId?: string;
  clientName?: string;
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid";
  notes?: string;
  approvedBy?: number;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

interface NewCommission {
  agentId: number;
  leadId?: string;
  clientId?: string;
  dealValue: number;
  commissionRate: number;
  notes?: string;
}

export default function CommissionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newCommission, setNewCommission] = useState<NewCommission>({
    agentId: 0,
    dealValue: 0,
    commissionRate: 10,
  });

  const { data: commissions = [], isLoading } = useQuery<Commission[]>({
    queryKey: ["/api/commissions", filterStatus],
  });

  const { data: salesAgents = [] } = useQuery<any[]>({
    queryKey: ["/api/users/sales-agents"],
  });

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const createCommissionMutation = useMutation({
    mutationFn: async (data: NewCommission) => {
      const commissionAmount = (data.dealValue * data.commissionRate) / 100;
      const res = await apiRequest("POST", "/api/commissions", {
        ...data,
        commissionAmount,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions"] });
      setIsAddDialogOpen(false);
      setNewCommission({ agentId: 0, dealValue: 0, commissionRate: 10 });
      toast({
        title: "Commission created",
        description: "Commission record has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create commission",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCommissionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/commissions/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions"] });
      toast({
        title: "Status updated",
        description: "Commission status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommission.agentId === 0 || newCommission.dealValue === 0) {
      toast({
        title: "Missing information",
        description: "Please select an agent and enter a deal value.",
        variant: "destructive",
      });
      return;
    }
    createCommissionMutation.mutate(newCommission);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      paid: "outline",
    };
    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle2,
      paid: DollarSign,
    };
    const Icon = icons[status] || Clock;
    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCommissions = filterStatus === "all" 
    ? commissions 
    : commissions.filter(c => c.status === filterStatus);

  const totalPending = commissions
    .filter(c => c.status === "pending")
    .reduce((sum, c) => sum + parseFloat(c.commissionAmount.toString()), 0);

  const totalApproved = commissions
    .filter(c => c.status === "approved")
    .reduce((sum, c) => sum + parseFloat(c.commissionAmount.toString()), 0);

  const totalPaid = commissions
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + parseFloat(c.commissionAmount.toString()), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Commission Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Manage sales agent commissions and payouts
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Commission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Commission</DialogTitle>
              <DialogDescription>
                Create a commission record for a sales agent
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCommission}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent">Sales Agent *</Label>
                  <Select
                    value={newCommission.agentId.toString()}
                    onValueChange={(value) => setNewCommission({ ...newCommission, agentId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.firstName} {agent.lastName} ({agent.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead">Lead (Optional)</Label>
                  <Select
                    value={newCommission.leadId || ""}
                    onValueChange={(value) => setNewCommission({ ...newCommission, leadId: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name || lead.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dealValue">Deal Value ($) *</Label>
                    <Input
                      id="dealValue"
                      type="number"
                      step="0.01"
                      value={newCommission.dealValue}
                      onChange={(e) => setNewCommission({ ...newCommission, dealValue: parseFloat(e.target.value) })}
                      placeholder="5000.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      value={newCommission.commissionRate}
                      onChange={(e) => setNewCommission({ ...newCommission, commissionRate: parseFloat(e.target.value) })}
                      placeholder="10.00"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Commission Amount:</p>
                  <p className="text-2xl font-bold text-primary">
                    ${((newCommission.dealValue * newCommission.commissionRate) / 100).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newCommission.notes || ""}
                    onChange={(e) => setNewCommission({ ...newCommission, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCommissionMutation.isPending}>
                  {createCommissionMutation.isPending ? "Creating..." : "Create Commission"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter(c => c.status === "pending").length} commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalApproved.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter(c => c.status === "approved").length} commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter(c => c.status === "paid").length} commissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commissions</CardTitle>
              <CardDescription>All commission records</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No commissions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Lead/Client</TableHead>
                  <TableHead>Deal Value</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.agentName}</TableCell>
                    <TableCell>{commission.leadName || commission.clientName || "—"}</TableCell>
                    <TableCell>${parseFloat(commission.dealValue.toString()).toFixed(2)}</TableCell>
                    <TableCell>{commission.commissionRate}%</TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      ${parseFloat(commission.commissionAmount.toString()).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell>{new Date(commission.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {commission.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCommissionStatusMutation.mutate({ id: commission.id, status: "approved" })}
                          >
                            Approve
                          </Button>
                        )}
                        {commission.status === "approved" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateCommissionStatusMutation.mutate({ id: commission.id, status: "paid" })}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

