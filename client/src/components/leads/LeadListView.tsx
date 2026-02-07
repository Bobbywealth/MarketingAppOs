import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DollarSign,
  MessageSquare,
  FileText,
  BrainCircuit,
  Wand2,
  Sparkles,
  PhoneForwarded,
  Video,
  User,
  Globe,
  Calendar,
  CheckCircle2
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
import { formatDistanceToNow } from "date-fns";

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
  onSendPaymentLink: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
}

const getScoreBadge = (score: string | null) => {
  if (!score) return null;
  const colors = {
    hot: "bg-orange-100 text-orange-700 border-orange-200",
    warm: "bg-blue-100 text-blue-700 border-blue-200",
    cold: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const icon = score === 'hot' ? '🔥' : score === 'warm' ? '☀️' : '❄️';
  return (
    <Badge variant="outline" className={`ml-2 text-[10px] px-1.5 py-0 h-4 border ${colors[score as keyof typeof colors] || ""}`}>
      {icon} {score.charAt(0).toUpperCase() + score.slice(1)}
    </Badge>
  );
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
  onAIDraftOutreach,
  onSendPaymentLink,
  onConvert
}) => {
  return (
    <div className="overflow-hidden bg-background rounded-xl border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 w-[40px]">
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
                    <Square className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </button>
              </th>
              <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
              <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
              <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Industry</th>
              <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Activity</th>
              <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Follow-up</th>
              <th className="p-4 text-right w-[140px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`group hover:bg-muted/50 cursor-pointer transition-colors ${
                  selectedLeads.has(lead.id) ? 'bg-primary/5' : ''
                }`}
                onClick={() => onLeadClick(lead)}
              >
                <td className="p-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection(lead.id);
                    }}
                    className={`p-1 hover:bg-accent rounded-md transition-colors ${
                      !selectedLeads.has(lead.id) ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    {selectedLeads.has(lead.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted border flex items-center justify-center shrink-0 overflow-hidden font-bold text-muted-foreground text-xs">
                      {lead.company?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-semibold text-foreground text-sm">
                          {lead.company || "N/A"}
                        </span>
                        {getScoreBadge(lead.score)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-normal">
                          {lead.source?.replace(/_/g, ' ') || "Direct"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-foreground">{lead.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {lead.email && <Mail className="w-3.5 h-3.5 text-muted-foreground" />}
                    {lead.website && <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="outline" className="text-xs font-normal">
                    {lead.industry || "General"}
                  </Badge>
                </td>
                <td className="p-4">
                  {lead.lastContactMethod ? (
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                        {lead.lastContactMethod === 'call' && <Phone className="w-3.5 h-3.5 text-muted-foreground" />}
                        {lead.lastContactMethod === 'email' && <Mail className="w-3.5 h-3.5 text-muted-foreground" />}
                        {lead.lastContactMethod === 'sms' && <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
                        {lead.lastContactMethod === 'meeting' && <Video className="w-3.5 h-3.5 text-muted-foreground" />}
                        {!['call', 'email', 'sms', 'meeting'].includes(lead.lastContactMethod) && <Phone className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground capitalize">{lead.lastContactMethod}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {lead.lastContactDate
                            ? formatDistanceToNow(new Date(lead.lastContactDate), { addSuffix: true })
                            : lead.updatedAt
                            ? formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })
                            : 'Recently'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not contacted</span>
                  )}
                </td>
                <td className="p-4">
                  {lead.nextFollowUpDate ? (
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.nextFollowUpDate), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No follow-up set</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                      onClick={(e) => { e.stopPropagation(); if (lead.phone) onCall(lead.phone); }}
                      disabled={!lead.phone}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                      onClick={(e) => { e.stopPropagation(); if (lead.email) window.location.href = `mailto:${lead.email}`; }}
                      disabled={!lead.email}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                      onClick={(e) => { e.stopPropagation(); onSendPaymentLink(lead); }}
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLeadClick(lead); }}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
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
                          onClick={(e) => { e.stopPropagation(); onSendPaymentLink(lead); }}
                          className="text-emerald-600 focus:text-emerald-700"
                        >
                          <DollarSign className="w-4 h-4 mr-2" /> Send Payment Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onConvert(lead); }}
                          className="text-blue-600 focus:text-blue-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Convert to Client
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
