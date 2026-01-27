import * as React from "react"

import { cn } from "@/lib/utils"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to include standard page padding */
  includePadding?: boolean
  /** Maximum width variant */
  maxWidth?: "default" | "wide" | "full"
}

function PageContainer({
  children,
  className,
  includePadding = true,
  maxWidth = "default",
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto",
        maxWidth === "default" && "max-w-7xl",
        maxWidth === "wide" && "max-w-full",
        maxWidth === "full" && "max-w-none",
        includePadding && "p-4 sm:p-6 lg:p-8 xl:p-12",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section variant for different spacing needs */
  variant?: "default" | "compact" | "loose"
}

function Section({
  children,
  className,
  variant = "default",
  ...props
}: SectionProps) {
  return (
    <div
      className={cn(
        "grid",
        variant === "compact" && "gap-4",
        variant === "default" && "gap-6",
        variant === "loose" && "gap-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface FlexRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment on the main axis */
  justify?: "start" | "center" | "end" | "between" | "around"
  /** Alignment on the cross axis */
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  /** Gap between items */
  gap?: "none" | "tight" | "default" | "loose"
}

function FlexRow({
  children,
  className,
  justify = "start",
  align = "stretch",
  gap = "default",
  ...props
}: FlexRowProps) {
  return (
    <div
      className={cn(
        "flex",
        justify === "start" && "justify-start",
        justify === "center" && "justify-center",
        justify === "end" && "justify-end",
        justify === "between" && "justify-between",
        justify === "around" && "justify-around",
        align === "start" && "items-start",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        align === "baseline" && "items-baseline",
        gap === "none" && "gap-0",
        gap === "tight" && "gap-2",
        gap === "default" && "gap-4",
        gap === "loose" && "gap-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface FlexColProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment on the main axis */
  justify?: "start" | "center" | "end" | "between" | "around"
  /** Alignment on the cross axis */
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  /** Gap between items */
  gap?: "none" | "tight" | "default" | "loose"
}

function FlexCol({
  children,
  className,
  justify = "start",
  align = "stretch",
  gap = "default",
  ...props
}: FlexColProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        justify === "start" && "justify-start",
        justify === "center" && "justify-center",
        justify === "end" && "justify-end",
        justify === "between" && "justify-between",
        justify === "around" && "justify-around",
        align === "start" && "items-start",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        align === "baseline" && "items-baseline",
        gap === "none" && "gap-0",
        gap === "tight" && "gap-2",
        gap === "default" && "gap-4",
        gap === "loose" && "gap-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {}

function Center({ children, className, ...props }: CenterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  PageContainer,
  Section,
  FlexRow,
  FlexCol,
  Center,
}
