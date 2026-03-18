import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type VibePageShellProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function VibePageShell({ children, className, containerClassName }: VibePageShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,white_40%,#eef2ff_100%)] text-slate-900",
        className,
      )}
    >
      <div className={cn("mx-auto max-w-[1680px] p-4 md:p-6 xl:p-8", containerClassName)}>{children}</div>
    </div>
  );
}
