import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "dots";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const dotSizeClasses = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
};

export function LoadingState({
  variant = "spinner",
  size = "md",
  message,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {variant === "spinner" && (
        <Loader2
          className={cn("animate-spin text-primary", sizeClasses[size])}
        />
      )}

      {variant === "dots" && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn("rounded-full bg-primary", dotSizeClasses[size])}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {variant === "skeleton" && (
        <div className="space-y-2 w-full max-w-xs">
          <div className="h-4 bg-muted rounded skeleton-pulse" />
          <div className="h-4 bg-muted rounded w-3/4 skeleton-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 skeleton-pulse" />
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}

      <span className="sr-only">{message || "Loading..."}</span>
    </div>
  );
}

// Full-page loading state
export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <LoadingState variant="spinner" size="lg" message={message} />
    </div>
  );
}

// Inline loading for buttons
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />
  );
}

// Skeleton components for content loading
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-muted rounded skeleton-pulse",
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {/* Header */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-12" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "compact" | "illustrated";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "default" && "py-12 px-4",
        variant === "compact" && "py-6 px-4",
        variant === "illustrated" && "py-16 px-4",
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
