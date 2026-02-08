import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskProgressBarProps {
  task: Task;
  onUpdate: (checklist: ChecklistItem[], progress: number) => void;
  compact?: boolean;
}

export function TaskProgressBar({
  task,
  onUpdate,
  compact = false,
}: TaskProgressBarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isExpanded, setIsExpanded] = useState(!compact);

  const checklist = (task.checklist as ChecklistItem[] | null) || [];
  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const updateChecklistMutation = useMutation({
    mutationFn: async (newChecklist: ChecklistItem[]) => {
      const res = await apiRequest("PATCH", `/api/tasks/${task.id}`, {
        checklist: newChecklist,
      });
      return res.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task.id}`] });
      toast({ title: "Checklist updated" });
    },
    onError: () => {
      toast({ title: "Failed to update checklist", variant: "destructive" });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false,
    };

    const newChecklist = [...checklist, newItem];
    const newProgress = (newChecklist.filter((i) => i.completed).length / newChecklist.length) * 100;
    updateChecklistMutation.mutate(newChecklist);
    onUpdate(newChecklist, newProgress);
    setNewItemText("");
    setIsAdding(false);
  };

  const handleToggleItem = (itemId: string) => {
    const newChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const newProgress = (newChecklist.filter((i) => i.completed).length / newChecklist.length) * 100;
    updateChecklistMutation.mutate(newChecklist);
    onUpdate(newChecklist, newProgress);
  };

  const handleDeleteItem = (itemId: string) => {
    const newChecklist = checklist.filter((item) => item.id !== itemId);
    const newProgress = newChecklist.length > 0 ? (newChecklist.filter((i) => i.completed).length / newChecklist.length) * 100 : 0;
    updateChecklistMutation.mutate(newChecklist);
    onUpdate(newChecklist, newProgress);
  };

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }
    const newChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, text: editingText.trim() } : item
    );
    updateChecklistMutation.mutate(newChecklist);
    onUpdate(newChecklist, progress);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact View */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Progress value={progress} className="flex-1 h-2" />
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Expanded Checklist */}
        {isExpanded && (
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 group"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id)}
                  id={`check-${item.id}`}
                />
                <span
                  className={`flex-1 text-sm ${
                    item.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.text}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {isAdding ? (
              <form onSubmit={handleAddItem} className="flex items-center gap-2">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add item..."
                  className="flex-1 h-8"
                  autoFocus
                />
                <Button type="submit" size="icon" className="h-8 w-8">
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsAdding(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add item
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-32 h-2" />
          <Badge variant="secondary">
            {Math.round(progress)}% Complete
          </Badge>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} items
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <form onSubmit={handleAddItem} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Enter checklist item..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={!newItemText.trim() || updateChecklistMutation.isPending}>
            {updateChecklistMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </form>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100" />
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => handleToggleItem(item.id)}
              id={`check-${item.id}`}
            />
            {editingId === item.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1 h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(item.id);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleSaveEdit(item.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm cursor-pointer ${
                    item.completed ? "line-through text-muted-foreground" : ""
                  }`}
                  onClick={() => handleToggleItem(item.id)}
                >
                  {item.text}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleStartEdit(item)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskProgressBar;
