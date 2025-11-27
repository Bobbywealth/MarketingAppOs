import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LeadAssignmentDialogProps {
  leadId: string;
  leadName: string;
  currentAgentId?: number;
  trigger?: React.ReactNode;
}

export function LeadAssignmentDialog({ 
  leadId, 
  leadName, 
  currentAgentId,
  trigger 
}: LeadAssignmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentAgentId?.toString() || "");
  const [reason, setReason] = useState("");

  const { data: salesAgents = [] } = useQuery<any[]>({
    queryKey: ["/api/users/sales-agents"],
  });

  const assignLeadMutation = useMutation({
    mutationFn: async (data: { leadId: string; agentId: number; reason?: string }) => {
      const res = await apiRequest("POST", "/api/leads/assign", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsOpen(false);
      setReason("");
      toast({
        title: "Lead assigned",
        description: `${leadName} has been assigned successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select a sales agent.",
        variant: "destructive",
      });
      return;
    }

    assignLeadMutation.mutate({
      leadId,
      agentId: parseInt(selectedAgentId),
      reason: reason || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Assign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Lead to Sales Agent</DialogTitle>
          <DialogDescription>
            Assign {leadName} to a sales agent for follow-up
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agent">Sales Agent *</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
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
            <Label htmlFor="reason">Assignment Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this lead being assigned to this agent?"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={assignLeadMutation.isPending}>
            {assignLeadMutation.isPending ? "Assigning..." : "Assign Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

