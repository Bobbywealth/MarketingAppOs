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
  Wand2
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
  onAIDraftOutreach
}) => {
  return (
    <Card 
      className={`group cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={() => onClick(lead)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(lead.id);
            }}
            className="p-1 hover:bg-accent rounded transition-colors flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-sm font-semibold">
              {(lead.company || lead.name)?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
            
          {/* Lead Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-base truncate">{lead.company || lead.name || 'Unnamed Lead'}</h3>
              {lead.stage && (
                <Badge variant={getStageBadge(lead.stage)} className="flex-shrink-0 text-xs">
                  {lead.stage.replace('_', ' ')}
                </Badge>
              )}
              {lead.score && (
                <Badge 
                  variant={lead.score === 'hot' ? 'destructive' : lead.score === 'warm' ? 'default' : 'secondary'}
                  className="flex-shrink-0 text-xs"
                >
                  {lead.score === 'hot' && '🔥'}
                  {lead.score === 'warm' && '☀️'}
                  {lead.score === 'cold' && '❄️'}
                  {lead.score}
                </Badge>
              )}
            </div>
              
            {/* Inline Contact Info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {lead.name && lead.company && (
                <span className="flex items-center gap-1">
                  👤 {lead.name}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  {lead.email}
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  {lead.phone}
                </span>
              )}
              {lead.value && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 flex-shrink-0" />
                  ${(Number(lead.value) / 100).toLocaleString()}
                </span>
              )}
            </div>

            {/* Contact Status & Last Contact */}
            {(lead.contactStatus !== 'not_contacted' || lead.lastContactMethod) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lead.contactStatus && lead.contactStatus !== 'not_contacted' && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      lead.contactStatus === 'contacted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      lead.contactStatus === 'in_discussion' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      lead.contactStatus === 'proposal_sent' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      lead.contactStatus === 'follow_up_needed' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      lead.contactStatus === 'no_response' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      ''
                    }`}
                  >
                    {lead.contactStatus === 'contacted' && '🟢'}
                    {lead.contactStatus === 'in_discussion' && '🔵'}
                    {lead.contactStatus === 'proposal_sent' && '🟡'}
                    {lead.contactStatus === 'follow_up_needed' && '🟠'}
                    {lead.contactStatus === 'no_response' && '🔴'}
                    {' '}{lead.contactStatus.replace(/_/g, ' ')}
                  </Badge>
                )}
                {lead.lastContactMethod && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {lead.lastContactMethod === 'email' && '📧'}
                    {lead.lastContactMethod === 'sms' && '💬'}
                    {lead.lastContactMethod === 'call' && '📞'}
                    {lead.lastContactMethod === 'meeting' && '🤝'}
                    {lead.lastContactMethod === 'social' && '📱'}
                    {lead.lastContactMethod === 'other' && '📋'}
                    Last: {lead.lastContactMethod}
                    {lead.lastContactDate && ` • ${new Date(lead.lastContactDate).toLocaleDateString()}`}
                  </span>
                )}
                {lead.nextFollowUpDate && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    ⏰ Next: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(lead);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  if (lead.phone) {
                    onCall(lead.phone);
                  }
                }}
                disabled={!lead.phone}
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Call
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (lead.email) {
                    window.location.href = `mailto:${lead.email}`;
                  }
                }}
                disabled={!lead.email}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onLogActivity(lead, 'call');
                }}
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Log Call
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onLogActivity(lead, 'email');
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Log Email
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onLogActivity(lead, 'sms');
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Log SMS
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onLogActivity(lead, 'note');
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onAIAnalyze(lead);
                }}
                className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
              >
                <BrainCircuit className="w-4 h-4 mr-2" />
                AI Analyze
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onAIDraftOutreach(lead);
                }}
                className="text-purple-600 focus:text-purple-700 focus:bg-purple-50"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Draft Outreach
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onEdit(lead);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onDelete(lead);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

