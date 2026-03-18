import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type VibeSectionCardProps = {
  children: ReactNode;
  className?: string;
  surface?: "lg" | "xl" | "2xl";
};

const surfaceStyles: Record<NonNullable<VibeSectionCardProps["surface"]>, string> = {
  lg: "rounded-xl",
  xl: "rounded-[24px]",
  "2xl": "rounded-[32px]",
};

export function VibeSectionCard({ children, className, surface = "2xl" }: VibeSectionCardProps) {
  return (
    <div className={cn(surfaceStyles[surface], "border border-slate-200 bg-white shadow-sm", className)}>{children}</div>
  );
}
