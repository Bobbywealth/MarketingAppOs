import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Square, 
  MoreVertical, 
  Eye, 
  PhoneCall, 
  Phone,
  Mail, 
  Edit, 
  Trash2,
  MessageSquare,
  FileText,
  BrainCircuit,
  Wand2,
  Sparkles
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
  onAIAnalyze: (lead: Lead) => void;
  onAIDraftOutreach: (lead: Lead) => void;
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
  onCall,
  onAIAnalyze,
  onAIDraftOutreach
}) => {
  return (
    <div className="border border-muted/40 rounded-xl overflow-hidden shadow-sm bg-background">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 border-b border-muted/40">
            <tr>
              <th className="p-3 md:p-4 w-[40px]">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAll();
                  }} 
                  className="p-1 hover:bg-accent rounded-md transition-colors"
                >
                  {selectedLeads.size === leads.length && leads.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground/60" />
                  )}
                </button>
              </th>
              <th className="p-3 md:p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</th>
              <th className="p-3 md:p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Contact</th>
              <th className="p-3 md:p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
              <th className="p-3 md:p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Phone</th>
              <th className="p-3 md:p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Stage</th>
              <th className="p-3 md:p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Temperature</th>
              <th className="p-3 md:p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Value</th>
              <th className="p-3 md:p-4 text-right w-[60px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/30">
            {leads.map((lead) => (
              <tr 
                key={lead.id}
                className={`group hover:bg-muted/20 cursor-pointer transition-colors ${
                  selectedLeads.has(lead.id) ? 'bg-primary/5' : ''
                }`}
                onClick={() => onLeadClick(lead)}
              >
                <td className="p-3 md:p-4">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onToggleSelection(lead.id);
                    }}
                    className={`p-1 hover:bg-accent rounded-md transition-colors ${
                      !selectedLeads.has(lead.id) ? 'md:opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    {selectedLeads.has(lead.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground/60" />
                    )}
                  </button>
                </td>
                <td className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-background shadow-sm shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary text-[10px] font-bold">
                        {(lead.company || lead.name)?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm block truncate group-hover:text-primary transition-colors">
                        {lead.company || lead.name || "N/A"}
                      </span>
                      <span className="text-[10px] text-muted-foreground lg:hidden">
                        {lead.name}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-3 md:p-4 text-sm hidden lg:table-cell">{(lead.company && lead.name) ? lead.name : "-"}</td>
                <td className="p-3 md:p-4 text-sm text-muted-foreground hidden md:table-cell">
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <Mail className="w-3.5 h-3.5 opacity-50" />
                    {lead.email || "-"}
                  </div>
                </td>
                <td className="p-3 md:p-4 text-sm hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 opacity-50" />
                    {lead.phone || "-"}
                  </div>
                </td>
                <td className="p-3 md:p-4">
                  {lead.stage ? (
                    <Badge variant={getStageBadge(lead.stage)} className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-tighter">
                      {lead.stage.replace('_', ' ')}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-3 md:p-4 hidden xl:table-cell">
                  {lead.score && (
                    <Badge 
                      variant={lead.score === 'hot' ? 'destructive' : lead.score === 'warm' ? 'default' : 'secondary'}
                      className="text-[10px] h-5 px-1.5 font-medium"
                    >
                      {lead.score === 'hot' && '🔥 '}
                      {lead.score === 'warm' && '☀️ '}
                      {lead.score === 'cold' && '❄️ '}
                      {lead.score}
                    </Badge>
                  )}
                </td>
                <td className="p-3 md:p-4 text-sm font-bold text-primary">
                  {lead.value ? `$${(Number(lead.value) / 100).toLocaleString()}` : "-"}
                </td>
                <td className="p-3 md:p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLeadClick(lead); }}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); if (lead.phone) onCall(lead.phone); }}
                        disabled={!lead.phone}
                      >
                        <PhoneCall className="w-4 h-4 mr-2" /> Call
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); if (lead.email) window.location.href = `mailto:${lead.email}`; }}
                        disabled={!lead.email}
                      >
                        <Mail className="w-4 h-4 mr-2" /> Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead, 'call'); }}>
                        <PhoneCall className="w-4 h-4 mr-2" /> Log Call
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead, 'email'); }}>
                        <Mail className="w-4 h-4 mr-2" /> Log Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead, 'note'); }}>
                        <FileText className="w-4 h-4 mr-2" /> Add Note
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onAIAnalyze(lead); 
                        }}
                        className="text-blue-600 focus:text-blue-700"
                      >
                        <BrainCircuit className="w-4 h-4 mr-2" /> AI Analyze
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onAIDraftOutreach(lead); 
                        }}
                        className="text-purple-600 focus:text-purple-700"
                      >
                        <Wand2 className="w-4 h-4 mr-2" /> AI Outreach
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
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

