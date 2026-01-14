import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Target,
  CheckCircle2,
  FileText,
  TrendingUp,
  XCircle,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

interface LeadsKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onSendPaymentLink?: (lead: Lead) => void;
  onConvertLead?: (lead: Lead) => void;
}

const STAGES = [
  {
    id: "prospect",
    label: "🎯 Prospect",
    description: "New leads to qualify",
    icon: Target,
    color: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
  },
  {
    id: "qualified",
    label: "✅ Qualified",
    description: "Interested & qualified",
    icon: CheckCircle2,
    color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "proposal",
    label: "📄 Proposal",
    description: "Proposal sent",
    icon: FileText,
    color: "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400",
  },
  {
    id: "closed_won",
    label: "🎉 Won",
    description: "Successfully closed",
    icon: TrendingUp,
    color: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
  },
  {
    id: "closed_lost",
    label: "❌ Lost",
    description: "Opportunity lost",
    icon: XCircle,
    color: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
  },
];

export function LeadsKanban({ leads, onLeadClick, onEditLead, onDeleteLead }: LeadsKanbanProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const updateLeadStageMutation = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${leadId}`, { stage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead updated",
        description: "Lead stage has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.stage !== newStage) {
      updateLeadStageMutation.mutate({
        leadId: draggedLead.id,
        stage: newStage,
      });
    }
    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage === stageId);
  };

  const getScoreBadge = (score: string) => {
    const variants: Record<string, { color: string; label: string; emoji: string }> = {
      hot: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Hot", emoji: "🔥" },
      warm: { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Warm", emoji: "☀️" },
      cold: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Cold", emoji: "❄️" },
    };
    const config = variants[score] || variants.warm;
    return (
      <Badge variant="outline" className={`${config.color} text-xs border`}>
        {config.emoji} {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-16rem)]">
      {STAGES.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        const totalValue = stageLeads.reduce(
          (sum, lead) => sum + (lead.dealValue ? parseFloat(lead.dealValue.toString()) : 0),
          0
        );

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <Card className={`h-full flex flex-col border-2 ${stage.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stage.icon className="w-5 h-5" />
                    <CardTitle className="text-lg font-semibold">
                      {stage.label.replace(/[🎯✅📄🎉❌]/g, '').trim()}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageLeads.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
                {totalValue > 0 && (
                  <div className="flex items-center gap-1 text-xs font-medium mt-2">
                    <DollarSign className="w-3 h-3" />
                    ${totalValue.toLocaleString()}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-3 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {stageLeads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <stage.icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No leads in this stage</p>
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <Card
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onDragEnd={handleDragEnd}
                          className={`cursor-move hover:shadow-lg transition-all ${
                            draggedLead?.id === lead.id ? "opacity-50 scale-95" : ""
                          } border-l-4 ${
                            lead.score === "hot"
                              ? "border-l-red-500"
                              : lead.score === "warm"
                              ? "border-l-orange-500"
                              : "border-l-blue-500"
                          }`}
                          onClick={() => onLeadClick(lead)}
                        >
                          <CardContent className="p-3 space-y-2">
                            {/* Header with company name and actions */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">
                                  {lead.company}
                                </h4>
                                {lead.name && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lead.name}
                                  </p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLeadClick(lead); }}>
                                    <User className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditLead(lead); }}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Edit Lead
                                  </DropdownMenuItem>
                                  {onSendPaymentLink && (
                                    <DropdownMenuItem 
                                      onClick={(e) => { e.stopPropagation(); onSendPaymentLink(lead); }}
                                      className="text-emerald-600 focus:text-emerald-700"
                                    >
                                      <DollarSign className="w-4 h-4 mr-2" />
                                      Send Payment Link
                                    </DropdownMenuItem>
                                  )}
                                  {onConvertLead && (
                                    <DropdownMenuItem 
                                      onClick={(e) => { e.stopPropagation(); onConvertLead(lead); }}
                                      className="text-blue-600 focus:text-blue-700"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Convert to Client
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Delete ${lead.company}?`)) {
                                        onDeleteLead(lead.id);
                                      }
                                    }}
                                    className="text-destructive"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Score badge */}
                            <div className="flex items-center gap-2">
                              {getScoreBadge(lead.score)}
                              {lead.industry && (
                                <Badge variant="outline" className="text-xs">
                                  {lead.industry}
                                </Badge>
                              )}
                            </div>

                            {/* Contact info */}
                            <div className="space-y-1">
                              {lead.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{lead.email}</span>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                              {lead.location && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{lead.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Deal value and expected close */}
                            {(lead.dealValue || lead.expectedCloseDate) && (
                              <div className="flex items-center gap-3 pt-2 border-t">
                                {lead.dealValue && (
                                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                    <DollarSign className="w-3 h-3" />
                                    ${parseFloat(lead.dealValue.toString()).toLocaleString()}
                                  </div>
                                )}
                                {lead.expectedCloseDate && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(lead.expectedCloseDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Contact status */}
                            {lead.contactStatus && lead.contactStatus !== "not_contacted" && (
                              <Badge variant="outline" className="text-xs">
                                {lead.contactStatus.replace(/_/g, " ")}
                              </Badge>
                            )}

                            {/* Assigned to */}
                            {lead.assignedToId && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-[8px]">
                                    {lead.assignedToId}
                                  </AvatarFallback>
                                </Avatar>
                                <span>Assigned</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

