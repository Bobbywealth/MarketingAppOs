import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Laptop } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    const onInstalled = () => {
      setInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      try {
        window.dispatchEvent(new CustomEvent("mta:pwa-installed"));
      } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isStandalone = useMemo(() => {
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  const isIOS = useMemo(() => {
    const ua = window.navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  }, []);

  const isAndroid = useMemo(() => {
    const ua = window.navigator.userAgent || "";
    return /Android/.test(ua);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
  };

  if (isStandalone) return null;
  if (!showInstallButton && !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ type: "spring", stiffness: 520, damping: 40 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(560px,calc(100vw-1.5rem))]"
      >
        <div className="bg-card/95 backdrop-blur border border-primary/20 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
            {isIOS ? <Smartphone className="h-5 w-5 text-primary" /> : <Laptop className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install Marketing Team App</p>
            {isIOS ? (
              <p className="text-xs text-muted-foreground">
                On iPhone/iPad: tap Share → <span className="font-medium">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Get quick access from your home screen — installs like a native app.
              </p>
            )}
            {isAndroid && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Tip: on Android you can also use Chrome menu → Add to Home screen.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!isIOS && (
              <Button onClick={handleInstallClick} size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Install
              </Button>
            )}
            <Button onClick={handleDismiss} variant="ghost" size="sm" aria-label="Dismiss install prompt">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {installed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium shadow-lg">
            Installed — welcome aboard.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

