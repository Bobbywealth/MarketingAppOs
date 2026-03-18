import { cn } from "@/lib/utils";

type VibeFilterChipsProps = {
  options: string[];
  active: string;
  onChange: (option: string) => void;
  className?: string;
};

export function VibeFilterChips({ options, active, onChange, className }: VibeFilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            active === option
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
