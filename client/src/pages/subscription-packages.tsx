import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Edit, Trash2, Eye, EyeOff, Check, X, Star, ArrowUp, ArrowDown, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SubscriptionPackage } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

export default function SubscriptionPackages() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const { toast } = useToast();

  const { data: packages = [], isLoading } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/admin/subscription-packages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/subscription-packages");
      return response.json();
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/subscription-packages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-packages"] });
      setCreateDialogOpen(false);
      setFeatures([]);
      toast({ title: "✅ Package created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create package", description: error.message, variant: "destructive" });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/subscription-packages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-packages"] });
      setEditDialogOpen(false);
      setEditingPackage(null);
      setFeatures([]);
      toast({ title: "✅ Package updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update package", description: error.message, variant: "destructive" });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/subscription-packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-packages"] });
      toast({ title: "✅ Package deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete package", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveStatus = (pkg: SubscriptionPackage) => {
    updatePackageMutation.mutate({
      id: pkg.id,
      data: { isActive: !pkg.isActive },
    });
  };

  const toggleFeaturedStatus = (pkg: SubscriptionPackage) => {
    updatePackageMutation.mutate({
      id: pkg.id,
      data: { isFeatured: !pkg.isFeatured },
    });
  };

  const movePackage = (pkg: SubscriptionPackage, direction: "up" | "down") => {
    const currentIndex = packages.findIndex((p) => p.id === pkg.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= packages.length) return;

    const targetPackage = packages[targetIndex];

    // Swap display orders
    updatePackageMutation.mutate({
      id: pkg.id,
      data: { displayOrder: targetPackage.displayOrder },
    });

    setTimeout(() => {
      updatePackageMutation.mutate({
        id: targetPackage.id,
        data: { displayOrder: pkg.displayOrder },
      });
    }, 100);
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const openEditDialog = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg);
    setFeatures((pkg.features as string[]) || []);
    setEditDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const price = parseFloat(formData.get("price") as string) * 100; // Convert to cents
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;

    createPackageMutation.mutate({
      name: formData.get("name"),
      description: formData.get("description"),
      price,
      billingPeriod: formData.get("billingPeriod"),
      features,
      stripePriceId: formData.get("stripePriceId") || null,
      stripeProductId: formData.get("stripeProductId") || null,
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      displayOrder,
      buttonText: formData.get("buttonText") || "Get Started",
      buttonLink: formData.get("buttonLink") || null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPackage) return;

    const formData = new FormData(e.currentTarget);
    const price = parseFloat(formData.get("price") as string) * 100; // Convert to cents
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;

    updatePackageMutation.mutate({
      id: editingPackage.id,
      data: {
        name: formData.get("name"),
        description: formData.get("description"),
        price,
        billingPeriod: formData.get("billingPeriod"),
        features,
        stripePriceId: formData.get("stripePriceId") || null,
        stripeProductId: formData.get("stripeProductId") || null,
        isActive: formData.get("isActive") === "on",
        isFeatured: formData.get("isFeatured") === "on",
        displayOrder,
        buttonText: formData.get("buttonText") || "Get Started",
        buttonLink: formData.get("buttonLink") || null,
      },
    });
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh flex items-center justify-center">
        <Package className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">Subscription Packages</h1>
            <p className="text-lg text-muted-foreground">Manage your pricing tiers and subscription plans</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-strong max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create Subscription Package</DialogTitle>
                <DialogDescription>Add a new pricing tier to your homepage</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Package Name *</Label>
                    <Input id="name" name="name" placeholder="e.g., Starter" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input id="price" name="price" type="number" step="0.01" placeholder="29.99" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Short description of the package" rows={3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingPeriod">Billing Period</Label>
                    <Input id="billingPeriod" name="billingPeriod" defaultValue="month" placeholder="month, year" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input id="displayOrder" name="displayOrder" type="number" defaultValue={0} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Features *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="Add a feature"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddFeature} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{feature}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFeature(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input id="buttonText" name="buttonText" defaultValue="Get Started" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonLink">Button Link</Label>
                    <Input id="buttonLink" name="buttonLink" placeholder="/signup" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripePriceId">Stripe Price ID (Optional)</Label>
                    <Input id="stripePriceId" name="stripePriceId" placeholder="price_xxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeProductId">Stripe Product ID (Optional)</Label>
                    <Input id="stripeProductId" name="stripeProductId" placeholder="prod_xxx" />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="isActive" name="isActive" defaultChecked />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="isFeatured" name="isFeatured" />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPackageMutation.isPending || features.length === 0}>
                    {createPackageMutation.isPending ? "Creating..." : "Create Package"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {packages.length === 0 ? (
          <Card className="glass-strong">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No packages yet</h3>
              <p className="text-muted-foreground mb-4">Create your first subscription package to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <Card key={pkg.id} className={`glass-strong relative ${pkg.isFeatured ? "border-primary border-2" : ""}`}>
                {pkg.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="mt-2">{pkg.description}</CardDescription>
                    </div>
                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-bold">{formatCurrency(pkg.price)}</span>
                    <span className="text-muted-foreground">/{pkg.billingPeriod}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Features:</p>
                    <ul className="space-y-1">
                      {(pkg.features as string[]).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pkg.stripePriceId && (
                    <div className="p-2 bg-muted/50 rounded text-xs space-y-1">
                      <p>
                        <span className="font-medium">Stripe Price:</span> {pkg.stripePriceId}
                      </p>
                      {pkg.stripeProductId && (
                        <p>
                          <span className="font-medium">Stripe Product:</span> {pkg.stripeProductId}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(pkg)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePackageMutation.mutate(pkg.id)}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActiveStatus(pkg)}
                      className="flex-1"
                    >
                      {pkg.isActive ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {pkg.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeaturedStatus(pkg)}
                      className="flex-1"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      {pkg.isFeatured ? "Unfeature" : "Feature"}
                    </Button>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => movePackage(pkg, "up")}
                      disabled={index === 0}
                      className="flex-1"
                    >
                      <ArrowUp className="w-4 h-4 mr-1" />
                      Move Up
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => movePackage(pkg, "down")}
                      disabled={index === packages.length - 1}
                      className="flex-1"
                    >
                      <ArrowDown className="w-4 h-4 mr-1" />
                      Move Down
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl glass-strong max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit Subscription Package</DialogTitle>
              <DialogDescription>Update the package details</DialogDescription>
            </DialogHeader>
            {editingPackage && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Package Name *</Label>
                    <Input id="edit-name" name="name" defaultValue={editingPackage.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price (USD) *</Label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={(editingPackage.price / 100).toFixed(2)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingPackage.description || ""}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-billingPeriod">Billing Period</Label>
                    <Input
                      id="edit-billingPeriod"
                      name="billingPeriod"
                      defaultValue={editingPackage.billingPeriod}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-displayOrder">Display Order</Label>
                    <Input
                      id="edit-displayOrder"
                      name="displayOrder"
                      type="number"
                      defaultValue={editingPackage.displayOrder}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Features *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="Add a feature"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddFeature} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{feature}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFeature(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-buttonText">Button Text</Label>
                    <Input
                      id="edit-buttonText"
                      name="buttonText"
                      defaultValue={editingPackage.buttonText || "Get Started"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-buttonLink">Button Link</Label>
                    <Input
                      id="edit-buttonLink"
                      name="buttonLink"
                      defaultValue={editingPackage.buttonLink || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-stripePriceId">Stripe Price ID</Label>
                    <Input
                      id="edit-stripePriceId"
                      name="stripePriceId"
                      defaultValue={editingPackage.stripePriceId || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-stripeProductId">Stripe Product ID</Label>
                    <Input
                      id="edit-stripeProductId"
                      name="stripeProductId"
                      defaultValue={editingPackage.stripeProductId || ""}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="edit-isActive" name="isActive" defaultChecked={editingPackage.isActive || false} />
                    <Label htmlFor="edit-isActive">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="edit-isFeatured" name="isFeatured" defaultChecked={editingPackage.isFeatured || false} />
                    <Label htmlFor="edit-isFeatured">Featured</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setEditingPackage(null);
                      setFeatures([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePackageMutation.isPending || features.length === 0}>
                    {updatePackageMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

