import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Square,
  MoreVertical,
  Eye,
  PhoneCall,
  Mail,
  MessageSquare,
  FileText,
  Edit,
  Trash2,
  DollarSign,
  Phone,
  Sparkles,
  BrainCircuit,
  Wand2,
  CheckCircle2,
  Clock
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

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onToggleSelection: (leadId: string) => void;
  onClick: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onLogActivity: (lead: Lead, type: string) => void;
  onCall: (phone: string) => void;
  onAIAnalyze: (lead: Lead) => void;
  onAIDraftOutreach: (lead: Lead) => void;
  onSendPaymentLink: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
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

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  isSelected,
  onToggleSelection,
  onClick,
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
    <Card 
      className={`group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-muted/40 ${
        isSelected ? 'ring-2 ring-primary bg-primary/5 shadow-md' : 'shadow-sm'
      }`}
      onClick={() => onClick(lead)}
    >
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox - Hidden on mobile if not selected for cleaner look, or always show if prefer */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(lead.id);
            }}
            className={`p-1 hover:bg-accent rounded transition-colors flex-shrink-0 mt-1 md:mt-0 ${
              !isSelected ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            } hidden md:block`}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Avatar with status indicator */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-primary/10 via-primary/5 to-purple-500/10 text-primary text-xs md:text-sm font-bold">
                {(lead.company || lead.name)?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            {lead.score === 'hot' && (
              <div className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] p-0.5 rounded-full shadow-sm animate-pulse">
                🔥
              </div>
            )}
          </div>
            
          {/* Lead Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <h3 className="font-bold text-sm md:text-base truncate text-foreground group-hover:text-primary transition-colors">
                  {lead.company || lead.name || 'Unnamed Lead'}
                </h3>
                {lead.company && lead.name && (
                  <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                    {lead.name}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {lead.stage && (
                  <Badge variant={getStageBadge(lead.stage)} className="text-[10px] h-5 px-1.5 uppercase font-bold tracking-wider">
                    {lead.stage.replace(/_/g, ' ')}
                  </Badge>
                )}
                {lead.value && (
                  <span className="text-xs font-bold text-primary">
                    ${(Number(lead.value) / 100).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
              
            {/* Action Buttons for Mobile - Quick Access */}
            <div className="flex md:hidden items-center gap-2 mt-3 pt-3 border-t border-muted/40">
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 flex-1 gap-1.5 text-[11px] font-semibold bg-primary/5 text-primary hover:bg-primary/10 border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  if (lead.phone) onCall(lead.phone);
                }}
                disabled={!lead.phone}
              >
                <PhoneCall className="w-3 h-3" />
                Call
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 flex-1 gap-1.5 text-[11px] font-semibold bg-purple-500/5 text-purple-600 hover:bg-purple-500/10 border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogActivity(lead, 'note');
                }}
              >
                <FileText className="w-3 h-3" />
                Note
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 w-8 p-0 bg-muted/50 text-muted-foreground border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(lead);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Desktop Info Row */}
            <div className="hidden md:flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground/80">
              {lead.email && (
                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {lead.email}
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                  {lead.phone}
                </span>
              )}
            </div>

            {/* Status Badges Row */}
            <div className="hidden md:flex flex-wrap gap-2 mt-2.5">
              {lead.contactStatus && lead.contactStatus !== 'not_contacted' && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] h-5 px-1.5 border-none shadow-none font-medium ${
                    lead.contactStatus === 'contacted' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    lead.contactStatus === 'in_discussion' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    lead.contactStatus === 'proposal_sent' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    lead.contactStatus === 'follow_up_needed' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                    lead.contactStatus === 'no_response' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="mr-1">
                    {lead.contactStatus === 'contacted' && '🟢'}
                    {lead.contactStatus === 'in_discussion' && '🔵'}
                    {lead.contactStatus === 'proposal_sent' && '🟡'}
                    {lead.contactStatus === 'follow_up_needed' && '🟠'}
                    {lead.contactStatus === 'no_response' && '🔴'}
                  </span>
                  {lead.contactStatus.replace(/_/g, ' ')}
                </Badge>
              )}
              {lead.nextFollowUpDate && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-500/5 text-amber-600 border-amber-200/50">
                  <Clock className="w-3 h-3 mr-1" />
                  Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions Dropdown */}
          <div className="flex flex-col gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(lead); }}>
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
                  onClick={(e) => { e.stopPropagation(); onAIAnalyze(lead); }}
                  className="text-blue-600 focus:text-blue-700"
                >
                  <BrainCircuit className="w-4 h-4 mr-2" /> AI Analyze
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onAIDraftOutreach(lead); }}
                  className="text-purple-600 focus:text-purple-700"
                >
                  <Wand2 className="w-4 h-4 mr-2" /> AI Outreach
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
        </div>
      </CardContent>
    </Card>
  );
};

