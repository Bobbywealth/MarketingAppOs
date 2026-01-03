import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdateBanner() {
  const [updateReady, setUpdateReady] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isStandalone = useMemo(() => {
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      // New SW took control; hard reload to ensure latest bundles
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // If an update is already waiting, surface it
    navigator.serviceWorker.getRegistration?.().then((reg) => {
      if (reg?.waiting) setUpdateReady(true);
    });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (!event?.data) return;
      if (event.data.type === "SW_ACTIVATED") {
        // We can choose to show “updated” toast later; no banner needed.
        return;
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  // Listen for SW updatefound and waiting
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;

    navigator.serviceWorker.getRegistration?.().then((reg) => {
      if (!reg) return;

      const onUpdateFound = () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (cancelled) return;
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            // New update is waiting
            setUpdateReady(true);
          }
        });
      };

      reg.addEventListener("updatefound", onUpdateFound);
      return () => reg.removeEventListener("updatefound", onUpdateFound);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = async () => {
    try {
      setUpdating(true);
      const reg = await navigator.serviceWorker.getRegistration?.();
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      } else {
        // Best-effort: ask SW to update
        await reg?.update?.();
      }
    } finally {
      // controllerchange will reload. If not, just stop spinner.
      setTimeout(() => setUpdating(false), 1500);
    }
  };

  if (!updateReady) return null;

  return (
    <div className="sticky top-0 z-[70] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-3 md:px-6 py-2 flex items-center gap-2 text-sm">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold">Update available</span>
        </div>
        <div className="text-muted-foreground">
          {isStandalone ? "A newer version is ready. Update for the best experience." : "A newer version is ready."}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8" onClick={applyUpdate} disabled={updating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`} />
            {updating ? "Updating…" : "Update"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setUpdateReady(false)}
            disabled={updating}
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}


