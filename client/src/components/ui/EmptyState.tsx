import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Plus,
  Search,
  FileQuestion,
  Inbox,
  Sparkles,
} from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "search" | "create" | "info";
}

/**
 * Reusable EmptyState component for consistent empty state patterns across the app
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  const variantStyles = {
    default: {
      icon: <Inbox className="w-12 h-12 text-muted-foreground/50" />,
      bg: "bg-muted/30",
    },
    search: {
      icon: <Search className="w-12 h-12 text-muted-foreground/50" />,
      bg: "bg-muted/20",
    },
    create: {
      icon: <Plus className="w-12 h-12 text-muted-foreground/50" />,
      bg: "bg-muted/20",
    },
    info: {
      icon: <FileQuestion className="w-12 h-12 text-muted-foreground/50" />,
      bg: "bg-muted/30",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-muted-foreground/20",
        styles.bg,
        className
      )}
    >
      <div className="mb-4 p-3 rounded-full bg-background shadow-sm">
        {icon || styles.icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex gap-3">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          <Button onClick={action.onClick}>
            {action.icon || <ArrowRight className="w-4 h-4 mr-2" />}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured empty state for lists with no items
 */
export function EmptyList({
  title = "No items yet",
  description = "Get started by adding your first item.",
  onCreate,
  entityName = "item",
}: {
  title?: string;
  description?: string;
  onCreate: () => void;
  entityName?: string;
}) {
  return (
    <EmptyState
      variant="create"
      icon={<Inbox className="w-12 h-12 text-muted-foreground/50" />}
      title={title}
      description={description}
      action={{
        label: `Add ${entityName}`,
        onClick: onCreate,
        icon: <Plus className="w-4 h-4 mr-2" />,
      }}
    />
  );
}

/**
 * Pre-configured empty state for search results with no matches
 */
export function EmptySearch({
  searchTerm,
  onClear,
}: {
  searchTerm: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      icon={<Search className="w-12 h-12 text-muted-foreground/50" />}
      title="No results found"
      description={`We couldn't find any results for "${searchTerm}". Try a different search term or clear the search.`}
      action={{
        label: "Clear search",
        onClick: onClear,
      }}
    />
  );
}

/**
 * Pre-configured empty state for AI features with no results
 */
export function EmptyAI({
  title = "No AI-generated content yet",
  description = "Use the AI assistant to generate content for your marketing campaigns.",
  onGenerate,
}: {
  title?: string;
  description?: string;
  onGenerate: () => void;
}) {
  return (
    <EmptyState
      variant="info"
      icon={<Sparkles className="w-12 h-12 text-muted-foreground/50" />}
      title={title}
      description={description}
      action={{
        label: "Generate with AI",
        onClick: onGenerate,
        icon: <Sparkles className="w-4 h-4 mr-2" />,
      }}
    />
  );
}

export default EmptyState;
