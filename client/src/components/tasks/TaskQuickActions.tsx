import { useState } from "react";
import { 
  X, 
  Trash2, 
  Archive, 
  UserPlus, 
  Tag, 
  CheckCircle2, 
  Clock,
  MoreHorizontal,
  Copy,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Task, User as UserType } from "@shared/schema";

interface TaskQuickActionsProps {
  selectedTaskIds: Set<string>;
  tasks: Task[];
  users: UserType[];
  onClearSelection: () => void;
  onBulkStatusChange: (status: string) => void;
  onBulkAssigneeChange: (assigneeId: number | null) => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onDuplicateTasks: (taskIds: string[]) => void;
}

export function TaskQuickActions({
  selectedTaskIds,
  tasks,
  users,
  onClearSelection,
  onBulkStatusChange,
  onBulkAssigneeChange,
  onBulkDelete,
  onBulkArchive,
  onDuplicateTasks,
}: TaskQuickActionsProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssigneeDialog, setShowAssigneeDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");

  if (selectedTaskIds.size === 0) {
    return null;
  }

  const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
  const selectedCount = selectedTaskIds.size;

  const handleStatusChange = (status: string) => {
    onBulkStatusChange(status);
    toast({
      title: "Status updated",
      description: `${selectedCount} task(s) moved to ${status.replace("_", " ")}`,
    });
  };

  const handleAssigneeChange = () => {
    if (selectedAssignee === "unassigned") {
      onBulkAssigneeChange(null);
    } else {
      onBulkAssigneeChange(parseInt(selectedAssignee));
    }
    setShowAssigneeDialog(false);
    setSelectedAssignee("");
    toast({
      title: "Assignee updated",
      description: `${selectedCount} task(s) reassigned`,
    });
  };

  const handleDelete = () => {
    onBulkDelete();
    setShowDeleteDialog(false);
    toast({
      title: "Tasks deleted",
      description: `${selectedCount} task(s) permanently deleted`,
      variant: "destructive",
    });
  };

  const handleDuplicate = () => {
    onDuplicateTasks(Array.from(selectedTaskIds));
    toast({
      title: "Tasks duplicated",
      description: `${selectedCount} task(s) copied`,
    });
  };

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-2 bg-card border shadow-lg rounded-full px-4 py-2">
          {/* Selection Count */}
          <Badge variant="secondary" className="rounded-full px-3">
            {selectedCount} selected
          </Badge>

          <div className="w-px h-6 bg-border" />

          {/* Quick Status Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange("todo")}
              className="h-8 rounded-full px-3"
              title="Mark as To Do"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              To Do
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange("in_progress")}
              className="h-8 rounded-full px-3"
              title="Mark as In Progress"
            >
              ⚡ In Progress
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange("completed")}
              className="h-8 rounded-full px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Mark as Completed"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Complete
            </Button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 rounded-full px-3">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowAssigneeDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Change Assignee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBulkArchive}>
                <Archive className="w-4 h-4 mr-2" />
                Archive Tasks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-border" />

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 rounded-full px-2"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} tasks?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The following tasks will be permanently deleted:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-y-auto space-y-1 py-2">
            {selectedTasks.slice(0, 5).map(task => (
              <div key={task.id} className="text-sm text-muted-foreground">
                • {task.title}
              </div>
            ))}
            {selectedTasks.length > 5 && (
              <div className="text-sm text-muted-foreground">
                ...and {selectedTasks.length - 5} more
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete {selectedCount} Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignee Selection Dialog */}
      <Dialog open={showAssigneeDialog} onOpenChange={setShowAssigneeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedCount} tasks</DialogTitle>
            <DialogDescription>
              Select a team member to assign these tasks to
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssigneeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssigneeChange} disabled={!selectedAssignee}>
              Update Assignee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
