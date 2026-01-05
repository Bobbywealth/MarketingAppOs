import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Laptop } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("pwa_install_dismissed") === "true";
  });

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

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not dismissed recently
      if (!dismissed) {
        setShowInstallButton(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    const onInstalled = () => {
      setInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      localStorage.setItem("pwa_install_dismissed", "true");
      try {
        window.dispatchEvent(new CustomEvent("mta:pwa-installed"));
      } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);

    // For iOS, we check if we should show the manual prompt
    if (isIOS && !isStandalone && !dismissed) {
      setShowInstallButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [dismissed, isIOS, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      localStorage.setItem("pwa_install_dismissed", "true");
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    setDismissed(true);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (isStandalone || dismissed) return null;
  if (!showInstallButton) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-[80px] md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-[420px] z-[100]"
      >
        <div className="bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <div className="h-16 w-16 rounded-[1.25rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-inner">
            {isIOS ? (
              <Smartphone className="h-8 w-8 text-primary animate-pulse" />
            ) : (
              <Download className="h-8 w-8 text-primary animate-bounce" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">Install Marketing App</h4>
            {isIOS ? (
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                Tap <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md mx-0.5"><Smartphone className="w-3.5 h-3.5" /></span> then <span className="font-bold text-slate-900 dark:text-white">"Add to Home Screen"</span>
              </p>
            ) : (
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Add to your home screen for the full, elite experience.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {!isIOS && (
              <Button onClick={handleInstallClick} size="sm" className="rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-5">
                Install
              </Button>
            )}
            <Button 
              onClick={handleDismiss} 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
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

