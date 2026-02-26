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
  onLogActivity: (lead: Lead) => void;
  onSendEmail: (lead: Lead) => void;
  onScheduleCall: (lead: Lead) => void;
  onSendSMS: (lead: Lead) => void;
  onViewTimeline: (lead: Lead) => void;
  onConvertToDeal: (lead: Lead) => void;
  onCallNow?: (lead: Lead) => void;
  onAIEnrich?: (lead: Lead) => void;
  onAIScore?: (lead: Lead) => void;
  onAutoSequence?: (lead: Lead) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'qualified': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'proposal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'negotiation': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'closed_won': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'closed_lost': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export function LeadCard({ 
  lead, 
  isSelected,
  onToggleSelection,
  onClick, 
  onEdit, 
  onDelete,
  onLogActivity,
  onSendEmail,
  onScheduleCall,
  onSendSMS,
  onViewTimeline,
  onConvertToDeal,
  onCallNow,
  onAIEnrich,
  onAIScore,
  onAutoSequence
}: LeadCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(String(lead.id));
            }}
            className="mt-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>

          {/* Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="text-sm font-medium">
              {lead.firstName?.[0]}{lead.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          {/* Main content */}
          <div className="flex-1 min-w-0" onClick={() => onClick(lead)}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">
                {lead.firstName} {lead.lastName}
              </h3>
              {lead.aiScore && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {lead.aiScore}
                </span>
              )}
            </div>
            
            {lead.company && (
              <p className="text-xs text-muted-foreground truncate mb-1">{lead.company}</p>
            )}
            
            {lead.jobTitle && (
              <p className="text-xs text-muted-foreground truncate mb-2">{lead.jobTitle}</p>
            )}

            <div className="flex flex-wrap gap-1 mb-2">
              <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${getStatusColor(lead.status || 'new')}`}>
                {lead.status || 'new'}
              </Badge>
              {lead.priority && (
                <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${getPriorityColor(lead.priority)}`}>
                  {lead.priority}
                </Badge>
              )}
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{lead.email}</span>
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              )}
            </div>

            {/* Next follow-up */}
            {lead.nextFollowUp && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Follow up: {new Date(lead.nextFollowUp).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(lead); }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Lead
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onCallNow && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCallNow(lead); }}>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Call Now
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendEmail(lead); }}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendSMS(lead); }}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send SMS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onScheduleCall(lead); }}>
                <Phone className="mr-2 h-4 w-4" />
                Schedule Call
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogActivity(lead); }}>
                <FileText className="mr-2 h-4 w-4" />
                Log Activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewTimeline(lead); }}>
                <Eye className="mr-2 h-4 w-4" />
                View Timeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConvertToDeal(lead); }}>
                <DollarSign className="mr-2 h-4 w-4" />
                Convert to Deal
              </DropdownMenuItem>
              {(onAIEnrich || onAIScore || onAutoSequence) && (
                <DropdownMenuSeparator />
              )}
              {onAIEnrich && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAIEnrich(lead); }}>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  AI Enrich
                </DropdownMenuItem>
              )}
              {onAIScore && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAIScore(lead); }}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Score
                </DropdownMenuItem>
              )}
              {onAutoSequence && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAutoSequence(lead); }}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Auto Sequence
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* AI Score indicator */}
        {lead.aiScore && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Score
              </span>
              <span className="text-xs font-medium">{lead.aiScore}/100</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                style={{ width: `${lead.aiScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Conversion ready indicator */}
        {lead.conversionReady && (
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Conversion Ready</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}