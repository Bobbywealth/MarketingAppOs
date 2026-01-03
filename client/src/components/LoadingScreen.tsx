import { useEffect, useMemo, useState } from "react";
import { LoadingLogo } from "@/components/Logo";

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(!!mq?.matches);
    update();
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);

  const statusText = useMemo(() => {
    if (progress < 25) return "Preparing your workspace…";
    if (progress < 55) return "Loading your dashboards…";
    if (progress < 85) return "Syncing essentials…";
    return "Almost ready…";
  }, [progress]);

  useEffect(() => {
    if (reducedMotion) {
      setProgress(100);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-background overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading application"
    >
      {/* Morphing gradient background (disabled with reduced-motion) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-[36%] bg-primary/20 blur-3xl animate-blob" />
        <div
          className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-[44%] bg-blue-500/15 blur-3xl animate-blob"
          style={{ animationDelay: "1.2s" }}
        />
        <div
          className="absolute top-1/3 right-1/3 h-[420px] w-[420px] rounded-[40%] bg-purple-500/10 blur-3xl animate-blob"
          style={{ animationDelay: "2.1s" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>

      <div className="relative w-full max-w-md px-6">
        <div className="rounded-2xl border bg-card/70 backdrop-blur-xl shadow-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
              <div className="relative rounded-2xl border bg-background/60 p-3">
                <LoadingLogo className={reducedMotion ? "drop-shadow-xl" : "animate-float drop-shadow-2xl"} />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">
                Marketing Team App
              </h1>
              <p className="text-sm text-muted-foreground">
                {statusText}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-2 rounded-full bg-muted/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-blue-500 to-primary transition-[width] duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundSize: "200% 100%",
                  animation: reducedMotion ? "none" : "mta-shimmer 1.8s linear infinite",
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Loading</span>
              <span>{progress}%</span>
            </div>

            {!reducedMotion && (
              <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mta-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes mta-blob {
          0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); border-radius: 36% 64% 62% 38% / 42% 43% 57% 58%; }
          33%  { transform: translate(18px, -14px) scale(1.08) rotate(60deg); border-radius: 58% 42% 40% 60% / 55% 46% 54% 45%; }
          66%  { transform: translate(-16px, 12px) scale(0.95) rotate(120deg); border-radius: 42% 58% 60% 40% / 44% 58% 42% 56%; }
          100% { transform: translate(0px, 0px) scale(1) rotate(180deg); border-radius: 36% 64% 62% 38% / 42% 43% 57% 58%; }
        }
        .animate-blob {
          animation: mta-blob 14s ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob, .animate-float, .animate-bounce { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

