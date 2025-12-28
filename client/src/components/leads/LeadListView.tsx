import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Square, 
  MoreVertical, 
  Eye, 
  PhoneCall, 
  Mail, 
  Edit, 
  Trash2,
  MessageSquare,
  FileText
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Lead } from "@shared/schema";

interface LeadListViewProps {
  leads: Lead[];
  selectedLeads: Set<string>;
  onToggleSelection: (leadId: string) => void;
  onSelectAll: () => void;
  onLeadClick: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onLogActivity: (lead: Lead, type: string) => void;
  onCall: (phone: string) => void;
}

const getStageBadge = (stage: string) => {
  const colors = {
    prospect: "default",
    qualified: "default",
    proposal: "secondary",
    closed_won: "default",
    closed_lost: "destructive",
  };
  return (colors[stage as keyof typeof colors] || "default") as "default" | "secondary" | "destructive" | "outline";
};

export const LeadListView: React.FC<LeadListViewProps> = ({
  leads,
  selectedLeads,
  onToggleSelection,
  onSelectAll,
  onLeadClick,
  onEdit,
  onDelete,
  onLogActivity,
  onCall
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3 text-xs font-semibold w-[40px]">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAll();
                  }} 
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  {selectedLeads.size === leads.length && leads.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="text-left p-3 text-xs font-semibold">Company</th>
              <th className="text-left p-3 text-xs font-semibold">Contact</th>
              <th className="text-left p-3 text-xs font-semibold">Email</th>
              <th className="text-left p-3 text-xs font-semibold">Phone</th>
              <th className="text-left p-3 text-xs font-semibold">Stage</th>
              <th className="text-left p-3 text-xs font-semibold">Score</th>
              <th className="text-left p-3 text-xs font-semibold">Value</th>
              <th className="text-right p-3 text-xs font-semibold w-[60px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr 
                key={lead.id}
                className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                  selectedLeads.has(lead.id) ? 'bg-primary/5' : ''
                }`}
                onClick={() => onLeadClick(lead)}
              >
                <td className="p-3">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onToggleSelection(lead.id);
                    }}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    {selectedLeads.has(lead.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary text-xs font-semibold">
                        {(lead.company || lead.name)?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{lead.company || lead.name || "N/A"}</span>
                  </div>
                </td>
                <td className="p-3 text-sm">{(lead.company && lead.name) ? lead.name : "-"}</td>
                <td className="p-3 text-sm text-muted-foreground truncate max-w-[200px]">
                  {lead.email || "-"}
                </td>
                <td className="p-3 text-sm">{lead.phone || "-"}</td>
                <td className="p-3">
                  {lead.stage ? (
                    <Badge variant={getStageBadge(lead.stage)} className="text-xs">
                      {lead.stage.replace('_', ' ')}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-3">
                  {lead.score && (
                    <Badge 
                      variant={lead.score === 'hot' ? 'destructive' : lead.score === 'warm' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {lead.score === 'hot' && '🔥 '}
                      {lead.score === 'warm' && '☀️ '}
                      {lead.score === 'cold' && '❄️ '}
                      {lead.score}
                    </Badge>
                  )}
                </td>
                <td className="p-3 text-sm font-medium">
                  {lead.value ? `$${(Number(lead.value) / 100).toLocaleString()}` : "-"}
                </td>
                <td className="p-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLeadClick(lead); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lead.phone) onCall(lead.phone);
                        }}
                        disabled={!lead.phone}
                      >
                        <PhoneCall className="w-4 h-4 mr-2" />
                        Call
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lead.email) window.location.href = `mailto:${lead.email}`;
                        }}
                        disabled={!lead.email}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead, 'call'); }}>
                        <PhoneCall className="w-4 h-4 mr-2" />
                        Log Call
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead, 'email'); }}>
                        <Mail className="w-4 h-4 mr-2" />
                        Log Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead, 'sms'); }}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Log SMS
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead, 'note'); }}>
                        <FileText className="w-4 h-4 mr-2" />
                        Add Note
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

