import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Mail, Phone, Globe, Building2, Edit, GripVertical, Trash2, DollarSign, BarChart3, Filter, SlidersHorizontal, ArrowUpDown, Clock, Activity, Tag, ExternalLink, MessageSquare, PhoneCall, LayoutGrid, List } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Clients() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [draggedClient, setDraggedClient] = useState<Client | null>(null);
  const [dragOverClient, setDragOverClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("none");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast} = useToast();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: subscriptionPackages = [] } = useQuery<any[]>({
    queryKey: ["/api/subscription-packages"],
    retry: false,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: async (response: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      const clientData = await response.json();
      
      // If a subscription package was selected, redirect to Stripe checkout
      if (variables.subscriptionPackageId && variables.subscriptionPackageId !== "none") {
        try {
          toast({ title: "Client created! Redirecting to payment..." });
          
          const checkoutResponse = await apiRequest("POST", "/api/create-checkout-session", {
            packageId: variables.subscriptionPackageId,
            email: variables.email,
            name: variables.name,
            clientId: clientData.id,
          });
          
          const checkoutData = await checkoutResponse.json();
          
          if (checkoutData.success && checkoutData.checkoutUrl) {
            // Redirect to Stripe checkout
            window.location.href = checkoutData.checkoutUrl;
          } else {
            toast({ 
              title: "Client created, but payment setup failed", 
              description: "You can set up payment later",
              variant: "destructive" 
            });
            setDialogOpen(false);
          }
        } catch (error) {
          console.error("Checkout error:", error);
          toast({ 
            title: "Client created, but payment setup failed", 
            description: "You can set up payment later",
            variant: "destructive" 
          });
          setDialogOpen(false);
        }
      } else {
        setDialogOpen(false);
        setPaymentMethod("none");
        toast({ title: "Client created successfully" });
      }
    },
    onError: () => {
      toast({ title: "Failed to create client", variant: "destructive" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setEditDialogOpen(false);
      setEditingClient(null);
      setSelectedClient(null);
      toast({ title: "✅ Client updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update client", variant: "destructive" });
    },
  });

  const reorderClientsMutation = useMutation({
    mutationFn: async (reorderedClients: Client[]) => {
      const promises = reorderedClients.map((client, index) =>
        apiRequest("PATCH", `/api/clients/${client.id}`, { displayOrder: index })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "✅ Clients reordered successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reorder clients", variant: "destructive" });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest("DELETE", `/api/clients/${clientId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      toast({ title: "✅ Client deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete client", variant: "destructive" });
    },
  });

  const bulkDeleteClientsMutation = useMutation({
    mutationFn: async (clientIds: string[]) => {
      const promises = clientIds.map(id => 
        apiRequest("DELETE", `/api/clients/${id}`, undefined)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSelectedClients(new Set());
      toast({ title: `✅ Deleted ${selectedClients.size} clients successfully` });
    },
    onError: () => {
      toast({ title: "Failed to delete clients", variant: "destructive" });
    },
  });

  const handleCreateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const serviceTags = (formData.get("serviceTags") as string)
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);

    const clientData: any = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      website: formData.get("website"),
      serviceTags,
      notes: formData.get("notes"),
    };

    // Add billing information if provided
    const subscriptionPackageId = formData.get("subscriptionPackageId");
    const paymentMethod = formData.get("paymentMethod");
    const invoiceAmount = formData.get("invoiceAmount");

    if (subscriptionPackageId) {
      clientData.subscriptionPackageId = subscriptionPackageId;
    }

    if (paymentMethod) {
      clientData.paymentMethod = paymentMethod;
    }

    if (invoiceAmount && paymentMethod === "manual") {
      clientData.invoiceAmount = parseFloat(invoiceAmount as string);
    }

    createClientMutation.mutate(clientData);
  };

  const handleEditClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;

    const formData = new FormData(e.currentTarget);
    const serviceTags = (formData.get("serviceTags") as string)
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);

    // Build social links object
    const socialLinks: any = {};
    const instagram = formData.get("instagram") as string;
    const facebook = formData.get("facebook") as string;
    const twitter = formData.get("twitter") as string;
    const linkedin = formData.get("linkedin") as string;

    if (instagram) socialLinks.instagram = instagram;
    if (facebook) socialLinks.facebook = facebook;
    if (twitter) socialLinks.twitter = twitter;
    if (linkedin) socialLinks.linkedin = linkedin;

    updateClientMutation.mutate({
      id: editingClient.id,
      data: {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        website: formData.get("website"),
        serviceTags,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        notes: formData.get("notes"),
      },
    });
  };

  const handleDragStart = (client: Client) => {
    setDraggedClient(client);
  };

  const handleDragOver = (e: React.DragEvent, client: Client) => {
    e.preventDefault();
    setDragOverClient(client);
  };

  const handleDrop = (e: React.DragEvent, targetClient: Client) => {
    e.preventDefault();
    if (!draggedClient || draggedClient.id === targetClient.id) {
      setDraggedClient(null);
      setDragOverClient(null);
      return;
    }

    const sortedClients = [...(clients || [])].sort((a, b) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    const draggedIndex = sortedClients.findIndex(c => c.id === draggedClient.id);
    const targetIndex = sortedClients.findIndex(c => c.id === targetClient.id);

    const newClients = [...sortedClients];
    const [removed] = newClients.splice(draggedIndex, 1);
    newClients.splice(targetIndex, 0, removed);

    reorderClientsMutation.mutate(newClients);

    setDraggedClient(null);
    setDragOverClient(null);
  };

  const handleDragEnd = () => {
    setDraggedClient(null);
    setDragOverClient(null);
  };

  // Get all unique tags from clients
  const allTags = Array.from(new Set(clients?.flatMap(c => c.serviceTags || []) || []));

  // Enhanced filtering and sorting
  const filteredClients = clients
    ?.filter((client) => {
      // Search filter
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter (mock data - you can add actual status field to schema)
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && client.stripeSubscriptionId) ||
        (statusFilter === "paused" && !client.stripeSubscriptionId) ||
        (statusFilter === "prospect" && !client.email);
      
      // Tag filter
      const matchesTag = tagFilter === "all" || 
        client.serviceTags?.includes(tagFilter);
      
      return matchesSearch && matchesStatus && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "alphabetical":
          return a.name.localeCompare(b.name);
        case "active":
          // Sort by subscription status
          return (b.stripeSubscriptionId ? 1 : 0) - (a.stripeSubscriptionId ? 1 : 0);
        case "displayOrder":
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass p-6">
                <div className="h-16 bg-muted/50 rounded-lg shimmer mb-4"></div>
                <div className="h-4 bg-muted/50 rounded w-3/4 shimmer"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 xl:p-12 space-y-4 md:space-y-6 lg:space-y-8">
        {/* Premium Header Section with Gradient */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent border border-border/50 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">Clients</h1>
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Manage your client relationships</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {filteredClients?.length || 0} clients
                </Badge>
                {statusFilter !== "all" && (
                  <Badge variant="outline" className="text-xs">
                    {statusFilter}
                  </Badge>
                )}
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setPaymentMethod("none");
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700" data-testid="button-add-client">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl glass-strong">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create New Client</DialogTitle>
                <DialogDescription>Add a new client to your CRM system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Client Name *</Label>
                    <Input id="name" name="name" required data-testid="input-client-name" className="glass" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" data-testid="input-company" className="glass" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" data-testid="input-email" className="glass" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" data-testid="input-phone" className="glass" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" placeholder="https://" data-testid="input-website" className="glass" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="serviceTags">Service Tags (comma-separated)</Label>
                    <Input id="serviceTags" name="serviceTags" placeholder="social media, lead gen, design" data-testid="input-service-tags" className="glass" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" rows={3} data-testid="input-notes" className="glass" />
                  </div>

                  {/* Billing Setup Section */}
                  <div className="col-span-2 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Billing Setup (Optional)</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subscriptionPackageId">Subscription Package</Label>
                        <Select name="subscriptionPackageId">
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select a package (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Package</SelectItem>
                            {subscriptionPackages.map((pkg: any) => (
                              <SelectItem key={pkg.id} value={pkg.id}>
                                {pkg.name} - ${(pkg.price / 100).toFixed(2)}/mo
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select 
                          name="paymentMethod" 
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (Set up later)</SelectItem>
                            <SelectItem value="stripe">Stripe (Automated Billing)</SelectItem>
                            <SelectItem value="manual">Manual Invoice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {paymentMethod === "manual" && (
                        <div className="space-y-2">
                          <Label htmlFor="invoiceAmount">Invoice Amount ($)</Label>
                          <Input 
                            id="invoiceAmount" 
                            name="invoiceAmount" 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            className="glass" 
                          />
                          <p className="text-xs text-muted-foreground">
                            This will create a manual invoice for the client to pay
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClientMutation.isPending} data-testid="button-submit-client" className="shadow-md">
                    {createClientMutation.isPending ? "Creating..." : "Create Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="whitespace-nowrap"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
            className="whitespace-nowrap"
          >
            <Activity className="w-3 h-3 mr-1" />
            Active
          </Button>
          <Button
            variant={statusFilter === "paused" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("paused")}
            className="whitespace-nowrap"
          >
            <Clock className="w-3 h-3 mr-1" />
            Paused
          </Button>
          <Button
            variant={statusFilter === "prospect" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("prospect")}
            className="whitespace-nowrap"
          >
            Prospect
          </Button>
        </div>

        {/* Enhanced Search Bar & Filters - Sticky on Scroll */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm p-4 rounded-xl border border-border/50 shadow-md space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 shadow-sm"
                data-testid="input-search-clients"
              />
            </div>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
                <SelectItem value="displayOrder">Custom Order</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Tag Filter */}
            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[180px]">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10" : ""}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none border-0"
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none border-0"
                title="List view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedClients.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {selectedClients.size} selected
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${selectedClients.size} clients?`)) {
                    bulkDeleteClientsMutation.mutate(Array.from(selectedClients));
                  }
                }}
                disabled={bulkDeleteClientsMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClients(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Premium Client Cards with Stagger Animation */}
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-fade-in" : "flex flex-col gap-3 stagger-fade-in"}>
          {filteredClients?.map((client) => (
            <Card 
              key={client.id}
              onDragOver={(e) => handleDragOver(e, client)}
              onDrop={(e) => handleDrop(e, client)}
              className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 ${viewMode === "grid" ? "card-hover-lift" : ""} gradient-border cursor-pointer ${
                draggedClient?.id === client.id ? 'opacity-50 scale-95' : ''
              } ${
                dragOverClient?.id === client.id ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onClick={() => setLocation(`/clients/${client.id}`)}
              data-testid={`card-client-${client.id}`}
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardContent className={`relative ${viewMode === "grid" ? "p-6" : "p-4"}`}>
                {/* Checkbox for selection */}
                <div className={`absolute z-10 ${viewMode === "grid" ? "top-4 left-4" : "top-4 left-4"}`} onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedClients.has(client.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedClients);
                      if (checked) {
                        newSelected.add(client.id);
                      } else {
                        newSelected.delete(client.id);
                      }
                      setSelectedClients(newSelected);
                    }}
                  />
                </div>

                {/* Delete button */}
                <div className={`absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity ${viewMode === "grid" ? "top-4 right-4" : "top-4 right-4"}`} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setClientToDelete(client.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className={`flex items-start gap-4 ${viewMode === "grid" ? "mb-4 mt-6" : "mt-6"}`}>
                  {/* Drag Handle - Only this triggers dragging */}
                  <div 
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(client);
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-md">
                      <AvatarImage src={client.logoUrl || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-lg font-bold">
                        {client.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate mb-1 group-hover:text-primary transition-colors">
                      {client.name}
                    </h3>
                    {client.company && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{client.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={viewMode === "grid" ? "space-y-2.5" : "flex flex-wrap items-center gap-2"}>
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm p-2 rounded-lg hover-elevate transition-all group/action hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover/action:bg-blue-500/20 transition-colors">
                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="truncate text-muted-foreground group-hover/action:text-blue-600 dark:group-hover/action:text-blue-400 transition-colors">{client.email}</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover/action:opacity-100 transition-opacity text-blue-600" />
                    </a>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg border border-transparent">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="truncate text-muted-foreground flex-1">{client.phone}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/phone?number=${encodeURIComponent(client.phone!)}&action=call`);
                          }}
                          title="Call this client"
                        >
                          <PhoneCall className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/phone?number=${encodeURIComponent(client.phone!)}&action=sms`);
                          }}
                          title="Send SMS"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {client.website && (
                    <a
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm p-2 rounded-lg hover-elevate transition-all group/action hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover/action:bg-purple-500/20 transition-colors">
                        <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="truncate text-muted-foreground group-hover/action:text-purple-600 dark:group-hover/action:text-purple-400 transition-colors">{client.website}</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover/action:opacity-100 transition-opacity text-purple-600" />
                    </a>
                  )}

                  {/* Social Media Links */}
                  {client.socialLinks && Object.keys(client.socialLinks as any).length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-sm p-2">
                      {(client.socialLinks as any).instagram && (
                        <a 
                          href={`https://instagram.com/${(client.socialLinks as any).instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 transition-colors"
                          title="Instagram"
                        >
                          <span className="text-pink-600 dark:text-pink-400">📷</span>
                          <span className="text-xs text-muted-foreground">{(client.socialLinks as any).instagram}</span>
                        </a>
                      )}
                      {(client.socialLinks as any).facebook && (
                        <a 
                          href={`https://facebook.com/${(client.socialLinks as any).facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                          title="Facebook"
                        >
                          <span className="text-blue-600 dark:text-blue-400">📘</span>
                          <span className="text-xs text-muted-foreground">{(client.socialLinks as any).facebook}</span>
                        </a>
                      )}
                      {(client.socialLinks as any).twitter && (
                        <a 
                          href={`https://twitter.com/${(client.socialLinks as any).twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                          title="Twitter/X"
                        >
                          <span className="text-sky-600 dark:text-sky-400">𝕏</span>
                          <span className="text-xs text-muted-foreground">{(client.socialLinks as any).twitter}</span>
                        </a>
                      )}
                      {(client.socialLinks as any).linkedin && (
                        <a 
                          href={`https://linkedin.com/in/${(client.socialLinks as any).linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-700/10 hover:bg-blue-700/20 transition-colors"
                          title="LinkedIn"
                        >
                          <span className="text-blue-700 dark:text-blue-400">💼</span>
                          <span className="text-xs text-muted-foreground">{(client.socialLinks as any).linkedin}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {client.serviceTags && client.serviceTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/50">
                    {client.serviceTags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-xs font-medium bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Empty State */}
        {filteredClients?.length === 0 && (
          <Card className="border-dashed border-2 glass-strong">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-lg">
                <Search className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Clients Found</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setDialogOpen(true)} size="lg" className="shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Client
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Client Details Dialog */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-strong">
            {selectedClient && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
                        <AvatarImage src={selectedClient.logoUrl || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xl font-bold">
                          {selectedClient.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <DialogTitle className="text-2xl">{selectedClient.name}</DialogTitle>
                        {selectedClient.company && (
                          <DialogDescription className="text-base flex items-center gap-2 mt-1">
                            <Building2 className="w-4 h-4" />
                            {selectedClient.company}
                          </DialogDescription>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingClient(selectedClient);
                        setEditDialogOpen(true);
                        setSelectedClient(null);
                      }}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Quick Social analytics entry */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Social analytics and connections</div>
                    <Link href={`/social?clientId=${selectedClient.id}`}>
                      <Button size="sm" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Open Social Overview
                      </Button>
                    </Link>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedClient.email && (
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-muted-foreground">Email</span>
                          </div>
                          <a href={`mailto:${selectedClient.email}`} className="text-foreground hover:text-primary transition-colors">
                            {selectedClient.email}
                          </a>
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-muted-foreground">Phone</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-foreground">{selectedClient.phone}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedClient(null);
                                  setLocation(`/phone?number=${encodeURIComponent(selectedClient.phone!)}&action=call`);
                                }}
                              >
                                <PhoneCall className="w-4 h-4 mr-1" />
                                Call
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedClient(null);
                                  setLocation(`/phone?number=${encodeURIComponent(selectedClient.phone!)}&action=sms`);
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                SMS
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedClient.website && (
                        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 col-span-full">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-muted-foreground">Website</span>
                          </div>
                          <a 
                            href={selectedClient.website.startsWith('http') ? selectedClient.website : `https://${selectedClient.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {selectedClient.website}
                            <Globe className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Media */}
                  {selectedClient.socialLinks && Object.keys(selectedClient.socialLinks).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Social Media</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedClient.socialLinks.instagram && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">📷</span>
                              <span className="text-sm font-medium text-muted-foreground">Instagram</span>
                            </div>
                            <a 
                              href={`https://instagram.com/${selectedClient.socialLinks.instagram.replace('@', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              @{selectedClient.socialLinks.instagram.replace('@', '')}
                            </a>
                          </div>
                        )}
                        {selectedClient.socialLinks.facebook && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">📘</span>
                              <span className="text-sm font-medium text-muted-foreground">Facebook</span>
                            </div>
                            <a 
                              href={`https://facebook.com/${selectedClient.socialLinks.facebook}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              {selectedClient.socialLinks.facebook}
                            </a>
                          </div>
                        )}
                        {selectedClient.socialLinks.twitter && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">𝕏</span>
                              <span className="text-sm font-medium text-muted-foreground">Twitter/X</span>
                            </div>
                            <a 
                              href={`https://twitter.com/${selectedClient.socialLinks.twitter.replace('@', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              @{selectedClient.socialLinks.twitter.replace('@', '')}
                            </a>
                          </div>
                        )}
                        {selectedClient.socialLinks.tiktok && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-slate-900/10 to-slate-700/10 border border-slate-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">🎵</span>
                              <span className="text-sm font-medium text-muted-foreground">TikTok</span>
                            </div>
                            <a 
                              href={`https://tiktok.com/@${selectedClient.socialLinks.tiktok.replace('@', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              @{selectedClient.socialLinks.tiktok.replace('@', '')}
                            </a>
                          </div>
                        )}
                        {selectedClient.socialLinks.linkedin && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-700/10 to-blue-800/10 border border-blue-700/20">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">💼</span>
                              <span className="text-sm font-medium text-muted-foreground">LinkedIn</span>
                            </div>
                            <a 
                              href={`https://linkedin.com/in/${selectedClient.socialLinks.linkedin}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              {selectedClient.socialLinks.linkedin}
                            </a>
                          </div>
                        )}
                        {selectedClient.socialLinks.youtube && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">▶️</span>
                              <span className="text-sm font-medium text-muted-foreground">YouTube</span>
                            </div>
                            <a 
                              href={`https://youtube.com/@${selectedClient.socialLinks.youtube.replace('@', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              @{selectedClient.socialLinks.youtube.replace('@', '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subscription Package */}
                  {selectedClient.stripeSubscriptionId && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Subscription</h3>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Active Package</p>
                            <p className="font-semibold">Premium Subscription</p>
                            <p className="text-xs text-muted-foreground mt-1">Stripe ID: {selectedClient.stripeSubscriptionId}</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service Tags */}
                  {selectedClient.serviceTags && selectedClient.serviceTags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Services</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.serviceTags.map((tag, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-sm px-3 py-1 bg-gradient-to-r from-primary/10 to-purple-500/10"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedClient.notes && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Notes</h3>
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm whitespace-pre-wrap">{selectedClient.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="text-sm text-muted-foreground pt-4 border-t">
                    Added on {new Date(selectedClient.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit Client</DialogTitle>
              <DialogDescription>Update client information</DialogDescription>
            </DialogHeader>
            {editingClient && (
              <form onSubmit={handleEditClient} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input 
                      id="edit-name" 
                      name="name" 
                      defaultValue={editingClient.name} 
                      required 
                      placeholder="Client name" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input 
                      id="edit-email" 
                      name="email" 
                      type="email" 
                      defaultValue={editingClient.email || ""} 
                      placeholder="client@example.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input 
                      id="edit-phone" 
                      name="phone" 
                      type="tel" 
                      defaultValue={editingClient.phone || ""} 
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-company">Company</Label>
                    <Input 
                      id="edit-company" 
                      name="company" 
                      defaultValue={editingClient.company || ""} 
                      placeholder="Company name" 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-website">Website</Label>
                  <Input 
                    id="edit-website" 
                    name="website" 
                    type="url" 
                    defaultValue={editingClient.website || ""} 
                    placeholder="https://example.com" 
                  />
                </div>

                <div>
                  <Label htmlFor="edit-serviceTags">Service Tags</Label>
                  <Input 
                    id="edit-serviceTags" 
                    name="serviceTags" 
                    defaultValue={editingClient.serviceTags?.join(", ") || ""} 
                    placeholder="SEO, PPC, Social Media (comma separated)" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
                </div>

                {/* Social Media Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span>🌐</span>
                    Social Media Accounts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-instagram">Instagram</Label>
                      <Input 
                        id="edit-instagram" 
                        name="instagram" 
                        defaultValue={(editingClient.socialLinks as any)?.instagram || ""} 
                        placeholder="@username or https://instagram.com/..." 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-facebook">Facebook</Label>
                      <Input 
                        id="edit-facebook" 
                        name="facebook" 
                        defaultValue={(editingClient.socialLinks as any)?.facebook || ""} 
                        placeholder="username or profile URL" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-twitter">Twitter/X</Label>
                      <Input 
                        id="edit-twitter" 
                        name="twitter" 
                        defaultValue={(editingClient.socialLinks as any)?.twitter || ""} 
                        placeholder="@handle or profile URL" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-linkedin">LinkedIn</Label>
                      <Input 
                        id="edit-linkedin" 
                        name="linkedin" 
                        defaultValue={(editingClient.socialLinks as any)?.linkedin || ""} 
                        placeholder="username or profile URL" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea 
                    id="edit-notes" 
                    name="notes" 
                    defaultValue={editingClient.notes || ""} 
                    placeholder="Add any additional notes about the client..." 
                    rows={4} 
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateClientMutation.isPending}>
                    {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the client and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (clientToDelete) {
                    deleteClientMutation.mutate(clientToDelete);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </div>
  );
}

