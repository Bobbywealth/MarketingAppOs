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
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
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
