import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, MoreVertical, Edit, Trash2, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TaskSpace } from "@shared/schema";

export function TaskSpacesSidebar({ onSpaceSelect, selectedSpaceId }: {
  onSpaceSelect: (spaceId: string | null) => void;
  selectedSpaceId: string | null;
}) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<TaskSpace | null>(null);
  const [collapsedSpaces, setCollapsedSpaces] = useState<Set<string>>(new Set());

  const { data: spaces = [], isLoading } = useQuery<TaskSpace[]>({
    queryKey: ["/api/task-spaces"],
  });

  const createSpaceMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string }) => {
      const response = await apiRequest("POST", "/api/task-spaces", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-spaces"] });
      setIsCreateDialogOpen(false);
      toast({ title: "✅ Space created successfully" });
    },
    onError: (error: any) => {
      console.error("Create space error:", error);
      toast({ title: "Failed to create space", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const updateSpaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskSpace> }) => {
      const response = await apiRequest("PATCH", `/api/task-spaces/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-spaces"] });
      setEditingSpace(null);
      toast({ title: "✅ Space updated successfully" });
    },
    onError: (error: any) => {
      console.error("Update space error:", error);
      toast({ title: "Failed to update space", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/task-spaces/${id}`, {});
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-spaces"] });
      toast({ title: "✅ Space deleted successfully" });
    },
    onError: (error: any) => {
      console.error("Delete space error:", error);
      toast({ title: "Failed to delete space", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const handleCreateSpace = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSpaceMutation.mutate({
      name: formData.get("name") as string,
      icon: (formData.get("icon") as string) || "📁",
      color: (formData.get("color") as string) || "#3B82F6",
    });
  };

  const handleUpdateSpace = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSpace) return;
    const formData = new FormData(e.currentTarget);
    updateSpaceMutation.mutate({
      id: editingSpace.id,
      data: {
        name: formData.get("name") as string,
        icon: (formData.get("icon") as string) || editingSpace.icon,
        color: (formData.get("color") as string) || editingSpace.color,
      },
    });
  };

  const toggleSpaceCollapse = (spaceId: string) => {
    const newCollapsed = new Set(collapsedSpaces);
    if (newCollapsed.has(spaceId)) {
      newCollapsed.delete(spaceId);
    } else {
      newCollapsed.add(spaceId);
    }
    setCollapsedSpaces(newCollapsed);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 border-r">
      {/* All Tasks Button */}
      <Button
        variant={selectedSpaceId === null ? "default" : "ghost"}
        className="w-full justify-start gap-2"
        onClick={() => onSpaceSelect(null)}
      >
        <Folder className="w-4 h-4" />
        All Tasks
      </Button>

      {/* Spaces Header */}
      <div className="flex items-center justify-between px-2 py-2 mt-4">
        <span className="text-sm font-semibold text-muted-foreground">SPACES</span>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
              <DialogDescription>
                Organize your tasks into groups or projects
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <Label htmlFor="name">Space Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Client Projects, Marketing"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    name="icon"
                    placeholder="📁"
                    defaultValue="📁"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue="#3B82F6"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSpaceMutation.isPending}>
                  {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Spaces List */}
      <div className="space-y-1">
        {spaces.map((space) => (
          <div key={space.id}>
            <div
              className={`flex items-center gap-1 rounded-md hover:bg-accent transition-colors ${
                selectedSpaceId === space.id ? "bg-accent" : ""
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleSpaceCollapse(space.id)}
              >
                {collapsedSpaces.has(space.id) ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              <button
                className="flex-1 flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-accent text-left"
                onClick={() => onSpaceSelect(space.id)}
              >
                <span className="text-lg">{space.icon}</span>
                <span className="flex-1 truncate">{space.name}</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingSpace(space)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${space.name}"? Tasks will not be deleted.`)) {
                        deleteSpaceMutation.mutate(space.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Space Dialog */}
      <Dialog open={!!editingSpace} onOpenChange={() => setEditingSpace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
            <DialogDescription>Update space details</DialogDescription>
          </DialogHeader>
          {editingSpace && (
            <form onSubmit={handleUpdateSpace} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Space Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingSpace.name}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-icon">Icon (Emoji)</Label>
                  <Input
                    id="edit-icon"
                    name="icon"
                    defaultValue={editingSpace.icon || "📁"}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-color">Color</Label>
                  <Input
                    id="edit-color"
                    name="color"
                    type="color"
                    defaultValue={editingSpace.color || "#3B82F6"}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSpace(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateSpaceMutation.isPending}>
                  {updateSpaceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

