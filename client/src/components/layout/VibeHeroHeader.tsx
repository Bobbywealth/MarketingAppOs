import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type VibeHeroHeaderProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function VibeHeroHeader({
  title,
  description,
  eyebrow,
  action,
  children,
  className,
}: VibeHeroHeaderProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur",
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-6 text-white md:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            {eyebrow && (
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">{eyebrow}</div>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            {description && <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">{description}</p>}
          </div>
          {action && <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">{action}</div>}
        </div>
      </div>

      {children && <div className="px-5 py-5 md:px-6">{children}</div>}
    </section>
  );
}
