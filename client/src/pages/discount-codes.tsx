import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Percent, Calendar, Users, TrendingUp, Copy, Check, Trash2, Edit, BarChart3 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DiscountCode {
  id: number;
  code: string;
  description: string;
  discount_percentage: string;
  duration_months: number | null;
  stripe_coupon_id: string | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  applies_to_packages: string[] | null;
  created_at: string;
  creator_name: string;
  total_redemptions: number;
  total_discounted: string;
}

export default function DiscountCodes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountPercentage: "",
    durationMonths: "once",
    maxUses: "",
    expiresAt: "",
  });

  // Fetch discount codes
  const { data: discountCodes = [], isLoading } = useQuery<DiscountCode[]>({
    queryKey: ["/api/discounts"],
  });

  // Fetch packages for dropdown
  const { data: packages = [] } = useQuery({
    queryKey: ["/api/subscription-packages"],
  });

  // Create discount code mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/discounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "✅ Discount Code Created",
        description: "The discount code has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to create discount code",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/discounts/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      toast({
        title: "✅ Updated",
        description: "Discount code status updated.",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/discounts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      toast({
        title: "✅ Deleted",
        description: "Discount code deleted successfully.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountPercentage: "",
      durationMonths: "",
      maxUses: "",
      expiresAt: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discountPercentage) {
      toast({
        title: "❌ Validation Error",
        description: "Code and discount percentage are required",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      code: formData.code.toUpperCase(),
      description: formData.description,
      discountPercentage: parseFloat(formData.discountPercentage),
      durationMonths: (formData.durationMonths && formData.durationMonths !== "once") ? parseInt(formData.durationMonths) : null,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiresAt: formData.expiresAt || null,
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "📋 Copied!",
      description: `Code "${code}" copied to clipboard`,
    });
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  // Calculate stats
  const totalRedemptions = discountCodes.reduce((sum, code) => sum + code.total_redemptions, 0);
  const totalDiscounted = discountCodes.reduce((sum, code) => sum + parseFloat(code.total_discounted || "0"), 0);
  const activeCodes = discountCodes.filter(code => code.is_active).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discount Codes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promotional discount codes for your packages
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
              <DialogDescription>
                Create a new promotional discount code for your packages
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="code">Discount Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER25"
                      className="uppercase"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Summer promotion - 25% off for 3 months"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="discountPercentage">Discount Percentage * (%)</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    placeholder="25"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="durationMonths">Duration (Months)</Label>
                  <Select
                    value={formData.durationMonths}
                    onValueChange={(value) => setFormData({ ...formData, durationMonths: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="One-time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One-time only</SelectItem>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank for one-time discount
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank for unlimited
                  </p>
                </div>

                <div>
                  <Label htmlFor="expiresAt">Expiration Date</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank for no expiration
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Code"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discountCodes.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCodes} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRedemptions}</div>
            <p className="text-xs text-muted-foreground">
              Across all codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDiscounted.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total discount given
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Discount</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRedemptions > 0 ? `$${(totalDiscounted / totalRedemptions).toFixed(2)}` : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Per redemption
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Discount Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Discount Codes</CardTitle>
          <CardDescription>
            Manage your promotional discount codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : discountCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No discount codes yet. Create your first one!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Total Saved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-sm bg-muted px-2 py-1 rounded">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      {code.description && (
                        <p className="text-xs text-muted-foreground mt-1">{code.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {code.discount_percentage}% OFF
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {code.duration_months ? (
                        <span className="text-sm">{code.duration_months} months</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">One-time</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {code.uses_count}
                        {code.max_uses && ` / ${code.max_uses}`}
                      </div>
                      {code.max_uses && (
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{
                              width: `${Math.min((code.uses_count / code.max_uses) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{code.total_redemptions}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-green-600">
                        ${parseFloat(code.total_discounted || "0").toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: code.id, isActive: checked })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {code.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete discount code "${code.code}"?`)) {
                            deleteMutation.mutate(code.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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

