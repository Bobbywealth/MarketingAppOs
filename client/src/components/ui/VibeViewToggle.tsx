import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type VibeViewOption = {
  label: string;
  icon?: LucideIcon;
};

type VibeViewToggleProps = {
  options: VibeViewOption[];
  active: string;
  onChange: (label: string) => void;
  className?: string;
};

export function VibeViewToggle({ options, active, onChange, className }: VibeViewToggleProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.label}
            onClick={() => onChange(option.label)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              active === option.label
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
