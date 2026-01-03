import { useEffect, useMemo, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type QueueState = { remaining?: number; flushed?: number };

export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queue, setQueue] = useState<QueueState>({});

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event?.data) return;
      if (event.data.type === "API_QUEUE_FLUSHED") {
        setQueue({ flushed: event.data.flushed, remaining: event.data.remaining });
      }
      if (event.data.type === "API_QUEUED") {
        setQueue((prev) => ({ ...prev, remaining: (prev.remaining ?? 0) + 1 }));
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  const show = useMemo(() => !online || (queue.remaining ?? 0) > 0, [online, queue.remaining]);
  if (!show) return null;

  return (
    <div className="sticky top-0 z-[60] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-3 md:px-6 py-2 flex items-center gap-2 text-sm">
        {online ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Wifi className="h-4 w-4" />
            <span className="font-medium">Back online</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <WifiOff className="h-4 w-4" />
            <span className="font-medium">Offline mode</span>
          </div>
        )}

        <div className="text-muted-foreground">
          {!online ? (
            <span>Your actions will be queued and synced automatically.</span>
          ) : (queue.remaining ?? 0) > 0 ? (
            <span>Syncing queued actions… ({queue.remaining} remaining)</span>
          ) : (
            <span>All caught up.</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => navigator.serviceWorker?.controller?.postMessage({ type: "FLUSH_API_QUEUE" })}
            disabled={!online}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>
    </div>
  );
}


