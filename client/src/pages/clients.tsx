import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone, Globe, Building2, Edit, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [draggedClient, setDraggedClient] = useState<Client | null>(null);
  const [dragOverClient, setDragOverClient] = useState<Client | null>(null);
  const { toast} = useToast();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      toast({ title: "Client created successfully" });
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
    },
    onError: () => {
      toast({ title: "Failed to reorder clients", variant: "destructive" });
    },
  });

  const handleCreateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const serviceTags = (formData.get("serviceTags") as string)
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);

    createClientMutation.mutate({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      website: formData.get("website"),
      serviceTags,
      notes: formData.get("notes"),
    });
  };

  const handleEditClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;

    const formData = new FormData(e.currentTarget);
    const serviceTags = (formData.get("serviceTags") as string)
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);

    updateClientMutation.mutate({
      id: editingClient.id,
      data: {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        website: formData.get("website"),
        serviceTags,
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

  const filteredClients = clients
    ?.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

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
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        {/* Premium Header Section */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient" data-testid="text-page-title">Clients</h1>
            <p className="text-lg text-muted-foreground">Manage your client relationships</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all" data-testid="button-add-client">
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

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass shadow-sm"
            data-testid="input-search-clients"
          />
        </div>

        {/* Premium Client Cards with Stagger Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-fade-in">
          {filteredClients?.map((client) => (
            <Card 
              key={client.id}
              draggable
              onDragStart={() => handleDragStart(client)}
              onDragOver={(e) => handleDragOver(e, client)}
              onDrop={(e) => handleDrop(e, client)}
              onDragEnd={handleDragEnd}
              className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover-lift gradient-border ${
                draggedClient?.id === client.id ? 'opacity-50 scale-95 cursor-grabbing' : 'cursor-grab'
              } ${
                dragOverClient?.id === client.id ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              data-testid={`card-client-${client.id}`}
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardContent className="relative p-6">
                <div className="flex items-start gap-4 mb-4">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}>
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="relative cursor-pointer" onClick={() => setSelectedClient(client)}>
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

                <div className="space-y-2.5">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg hover-elevate transition-all">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="truncate text-muted-foreground">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg hover-elevate transition-all">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="truncate text-muted-foreground">{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg hover-elevate transition-all">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="truncate text-muted-foreground">{client.website}</span>
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
                          <a href={`tel:${selectedClient.phone}`} className="text-foreground hover:text-primary transition-colors">
                            {selectedClient.phone}
                          </a>
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
      </div>
    </div>
  );
}
