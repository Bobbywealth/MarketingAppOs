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
  MessageSquare,
  FileText,
  BrainCircuit,
  Wand2,
  Sparkles,
  PhoneForwarded,
  Video,
  User,
  Globe,
  Calendar
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
  onAIDraftOutreach
}) => {
  return (
    <div className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="p-4 w-[40px]">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAll();
                  }} 
                  className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {selectedLeads.size === leads.length && leads.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              </th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Industry</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Activity</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Action</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="p-4 text-right w-[140px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr 
                key={lead.id}
                className={`group hover:bg-slate-50/80 cursor-pointer transition-colors ${
                  selectedLeads.has(lead.id) ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => onLeadClick(lead)}
              >
                <td className="p-4">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onToggleSelection(lead.id);
                    }}
                    className={`p-1 hover:bg-slate-200 rounded-md transition-colors ${
                      !selectedLeads.has(lead.id) ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    {selectedLeads.has(lead.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden font-bold text-slate-500 text-xs">
                      {lead.company?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-semibold text-slate-900 text-sm">
                          {lead.company || "N/A"}
                        </span>
                        {getScoreBadge(lead.score)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-normal bg-slate-50 text-slate-500 border-slate-200">
                          {lead.source?.replace('_', ' ') || "Direct"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-900">{lead.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {lead.email && <Mail className="w-3.5 h-3.5 text-slate-400" />}
                    {lead.website && <Globe className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-normal bg-slate-50 text-slate-600 border-slate-200">
                      {lead.industry || "General"}
                    </Badge>
                    <span className="text-slate-400 text-xs">{lead.source?.replace('_', ' ') || "Website"}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">Called</div>
                      <div className="text-[10px] text-slate-500">{lead.updatedAt ? formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true }) : 'Recently'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-900">Follow up tomorrow</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500">Scheduled next step</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 border border-white shadow-sm">
                      <AvatarImage src={`https://avatar.vercel.sh/${lead.ownerId || 'team'}.png`} />
                      <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700 font-bold">
                        {lead.ownerId?.substring(0, 2).toUpperCase() || "TM"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-600 font-medium">Team</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                      <BrainCircuit className="w-4 h-4" />
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
