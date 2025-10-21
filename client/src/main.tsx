import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App";
import { LoadingScreen } from "./components/LoadingScreen";
import "./index.css";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
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

// Root component with loading screen
function Root() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load time (minimum 1 second for smooth UX)
    const minLoadTime = 1000;
    const startTime = Date.now();

    const checkReady = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= minLoadTime && document.readyState === 'complete') {
        setIsLoading(false);
      } else {
        requestAnimationFrame(checkReady);
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(() => setIsLoading(false), minLoadTime);
    } else {
      window.addEventListener('load', checkReady);
      return () => window.removeEventListener('load', checkReady);
    }
  }, []);

  return isLoading ? <LoadingScreen /> : <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
