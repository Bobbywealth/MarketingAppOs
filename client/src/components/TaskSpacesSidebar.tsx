import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, MoreVertical, Edit, Trash2, Folder, EyeOff, Eye, GripVertical } from "lucide-react";
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
  const [showHidden, setShowHidden] = useState(false);

  // Drag state
  const [draggedSpaceId, setDraggedSpaceId] = useState<string | null>(null);
  const [dragOverSpaceId, setDragOverSpaceId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);

  const { data: spaces = [], isLoading } = useQuery<TaskSpace[]>({
    queryKey: ["/api/task-spaces"],
  });

  const getChildren = (parentId: string | null) =>
    spaces
      .filter((s) => (s.parentSpaceId ?? null) === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));

  const flattenSpaceOptions = (opts?: { excludeIds?: Set<string> }) => {
    const excludeIds = opts?.excludeIds ?? new Set<string>();
    const out: Array<{ id: string; label: string }> = [];

    const walk = (parentId: string | null, depth: number) => {
      for (const s of getChildren(parentId)) {
        if (excludeIds.has(s.id)) continue;
        const indent = depth > 0 ? `${"— ".repeat(Math.min(depth, 6))}` : "";
        out.push({ id: s.id, label: `${indent}${s.icon ?? "📁"} ${s.name}` });
        walk(s.id, depth + 1);
      }
    };

    walk(null, 0);
    return out;
  };

  const getDescendantIds = (rootId: string) => {
    const out = new Set<string>();
    const walk = (id: string) => {
      for (const child of getChildren(id)) {
        if (out.has(child.id)) continue;
        out.add(child.id);
        walk(child.id);
      }
    };
    walk(rootId);
    return out;
  };

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

  const reorderMutation = useMutation({
    mutationFn: async (items: Array<{ id: string; order: number }>) => {
      const response = await apiRequest("PATCH", "/api/task-spaces-reorder", { items });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-spaces"] });
    },
    onError: (error: any) => {
      console.error("Reorder error:", error);
      toast({ title: "Failed to reorder spaces", variant: "destructive" });
    },
  });

  const toggleHideMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
      const response = await apiRequest("PATCH", `/api/task-spaces/${id}`, { isHidden });
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-spaces"] });
      toast({ title: variables.isHidden ? "Space hidden" : "Space visible" });
    },
    onError: (error: any) => {
      console.error("Toggle hide error:", error);
      toast({ title: "Failed to update space visibility", variant: "destructive" });
    },
  });

  const handleCreateSpace = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parentSpaceIdRaw = (formData.get("parentSpaceId") as string) || "";
    createSpaceMutation.mutate({
      name: formData.get("name") as string,
      icon: (formData.get("icon") as string) || "📁",
      color: (formData.get("color") as string) || "#3B82F6",
      ...(parentSpaceIdRaw ? { parentSpaceId: parentSpaceIdRaw } : {}),
    });
  };

  const handleUpdateSpace = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSpace) return;
    const formData = new FormData(e.currentTarget);
    const parentSpaceIdRaw = (formData.get("parentSpaceId") as string) || "";
    updateSpaceMutation.mutate({
      id: editingSpace.id,
      data: {
        name: formData.get("name") as string,
        icon: (formData.get("icon") as string) || editingSpace.icon,
        color: (formData.get("color") as string) || editingSpace.color,
        parentSpaceId: parentSpaceIdRaw ? parentSpaceIdRaw : null,
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

  // Drag-and-drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, spaceId: string) => {
    setDraggedSpaceId(spaceId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", spaceId);
    // Add a slight delay to show drag styling
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-space-id="${spaceId}"]`) as HTMLElement;
      if (el) el.style.opacity = "0.5";
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    // Reset opacity on previously dragged item
    if (draggedSpaceId) {
      const el = document.querySelector(`[data-space-id="${draggedSpaceId}"]`) as HTMLElement;
      if (el) el.style.opacity = "1";
    }
    setDraggedSpaceId(null);
    setDragOverSpaceId(null);
    setDropPosition(null);
  }, [draggedSpaceId]);

  const handleDragOver = useCallback((e: React.DragEvent, spaceId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "above" : "below";

    setDragOverSpaceId(spaceId);
    setDropPosition(pos);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSpaceId(null);
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetSpaceId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetSpaceId) {
      handleDragEnd();
      return;
    }

    const sourceSpace = spaces.find((s) => s.id === sourceId);
    const targetSpace = spaces.find((s) => s.id === targetSpaceId);
    if (!sourceSpace || !targetSpace) {
      handleDragEnd();
      return;
    }

    // Only reorder siblings (same parent)
    const parentId = targetSpace.parentSpaceId ?? null;
    const siblings = getChildren(parentId);
    const filteredSiblings = siblings.filter((s) => s.id !== sourceId);

    const targetIndex = filteredSiblings.findIndex((s) => s.id === targetSpaceId);
    const insertIndex = dropPosition === "above" ? targetIndex : targetIndex + 1;

    // Build new order
    const reordered = [...filteredSiblings];
    reordered.splice(insertIndex, 0, { ...sourceSpace, parentSpaceId: parentId });

    const items = reordered.map((s, i) => ({ id: s.id, order: i }));

    // If the source is moving to a different parent, update parentSpaceId too
    if ((sourceSpace.parentSpaceId ?? null) !== parentId) {
      updateSpaceMutation.mutate({
        id: sourceId,
        data: { parentSpaceId: parentId, order: insertIndex },
      });
      // Reorder the remaining items
      const remainingItems = items.filter((item) => item.id !== sourceId);
      if (remainingItems.length > 0) {
        reorderMutation.mutate(remainingItems);
      }
    } else {
      reorderMutation.mutate(items);
    }

    handleDragEnd();
  }, [spaces, dropPosition, getChildren, handleDragEnd, reorderMutation, updateSpaceMutation]);

  const hiddenCount = spaces.filter((s) => s.isHidden).length;

  const renderSpaceRow = (space: TaskSpace, depth: number) => {
    const children = getChildren(space.id);
    const visibleChildren = showHidden ? children : children.filter((c) => !c.isHidden);
    const isCollapsed = collapsedSpaces.has(space.id);
    const showChevron = visibleChildren.length > 0;
    const paddingLeft = depth === 0 ? "pl-0" : depth === 1 ? "pl-4" : depth === 2 ? "pl-7" : "pl-10";
    const isHidden = space.isHidden;
    const isDragOver = dragOverSpaceId === space.id;
    const isDragging = draggedSpaceId === space.id;

    return (
      <div key={space.id} className="space-y-1">
        {/* Drop indicator above */}
        {isDragOver && dropPosition === "above" && (
          <div className="h-0.5 bg-primary rounded-full mx-2" />
        )}
        <div
          data-space-id={space.id}
          draggable
          onDragStart={(e) => handleDragStart(e, space.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, space.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, space.id)}
          className={`flex items-center gap-1 rounded-md hover:bg-accent transition-colors group ${
            selectedSpaceId === space.id ? "bg-accent" : ""
          } ${paddingLeft} ${isHidden ? "opacity-50" : ""} ${isDragging ? "opacity-30" : ""}`}
        >
          {/* Drag handle */}
          <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>

          {showChevron ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => toggleSpaceCollapse(space.id)}
              aria-label={isCollapsed ? "Expand group" : "Collapse group"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}

          <button
            className="flex-1 flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-accent text-left min-w-0"
            onClick={() => onSpaceSelect(space.id)}
            title={space.name}
          >
            <span className="text-lg">{space.icon}</span>
            <span className="flex-1 truncate">{space.name}</span>
            {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
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
                onClick={() => toggleHideMutation.mutate({ id: space.id, isHidden: !isHidden })}
              >
                {isHidden ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </>
                )}
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
        {/* Drop indicator below */}
        {isDragOver && dropPosition === "below" && (
          <div className="h-0.5 bg-primary rounded-full mx-2" />
        )}

        {visibleChildren.length > 0 && !isCollapsed && (
          <div className="space-y-1">
            {visibleChildren.map((child) => renderSpaceRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
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

  const topLevelSpaces = getChildren(null);
  const visibleTopLevel = showHidden ? topLevelSpaces : topLevelSpaces.filter((s) => !s.isHidden);
  const parentSpaceOptions = flattenSpaceOptions();
  const editParentExcludeIds =
    editingSpace
      ? new Set<string>([editingSpace.id, ...Array.from(getDescendantIds(editingSpace.id))])
      : new Set<string>();
  const editParentSpaceOptions = editingSpace
    ? flattenSpaceOptions({ excludeIds: editParentExcludeIds })
    : [];

  return (
    <div className="space-y-2 p-3">
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
              <div>
                <Label htmlFor="parentSpaceId">Parent group (optional)</Label>
                <select
                  id="parentSpaceId"
                  name="parentSpaceId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">No parent</option>
                  {parentSpaceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a parent to group spaces in the sidebar.
                </p>
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
        {visibleTopLevel.map((space) => renderSpaceRow(space, 0))}
      </div>

      {/* Show/Hide hidden spaces toggle */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowHidden(!showHidden)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 w-full"
        >
          {showHidden ? (
            <>
              <EyeOff className="w-3 h-3" />
              Hide {hiddenCount} hidden space{hiddenCount !== 1 ? "s" : ""}
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              Show {hiddenCount} hidden space{hiddenCount !== 1 ? "s" : ""}
            </>
          )}
        </button>
      )}

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
              <div>
                <Label htmlFor="edit-parentSpaceId">Parent group (optional)</Label>
                <select
                  id="edit-parentSpaceId"
                  name="parentSpaceId"
                  defaultValue={editingSpace.parentSpaceId ?? ""}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">No parent</option>
                  {editParentSpaceOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                  ))}
                </select>
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
