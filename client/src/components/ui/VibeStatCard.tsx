import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VibeSectionCard } from "@/components/ui/VibeSectionCard";

type VibeStatCardProps = {
  label: string;
  value: string | number;
  note?: string;
  icon?: ReactNode;
  className?: string;
};

export function VibeStatCard({ label, value, note, icon, className }: VibeStatCardProps) {
  return (
    <VibeSectionCard surface="xl" className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          {note && <div className="mt-2 text-sm text-slate-500">{note}</div>}
        </div>
        {icon && <div>{icon}</div>}
      </div>
    </VibeSectionCard>
  );
}
