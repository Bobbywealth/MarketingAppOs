import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isNativeApp } from "@/lib/runtime";

// Theme bootstrap:
// - Always default to light unless user explicitly saved a preference.
// - Apply before React renders to avoid a "flash" of the wrong theme.
try {
  const saved = localStorage.getItem("theme");
  const initialTheme = saved === "dark" || saved === "light" ? saved : "light";
  document.documentElement.classList.toggle("dark", initialTheme === "dark");
} catch {
  // ignore (e.g. private mode / blocked storage)
}

// Register Service Worker for PWA
if (!isNativeApp() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              const shouldRefresh = window.confirm(
                "A new version is ready. Refresh now to use the latest updates?"
              );
              if (shouldRefresh && registration.waiting) {
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// PWA Install prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('💾 PWA install prompt ready');
});

createRoot(document.getElementById("root")!).render(<App />);
