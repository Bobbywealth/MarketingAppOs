import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Auto-reload on chunk load failures (common after deployments)
    const chunkFailedMessage = /Failed to fetch dynamically imported module|Loading chunk .* failed/;
    if (error?.message && chunkFailedMessage.test(error.message)) {
      console.log('Chunk load failure detected. Forcing page reload...');
      window.location.reload();
    }

    // Recover from TDZ initialization errors that can happen when a Service Worker
    // serves stale JS/CSS bundles across deployments (minified var names like 're', 'ae', etc).
    const tdzInitError = /Cannot access '.+' before initialization/;
    if (error?.message && tdzInitError.test(error.message)) {
      console.log('TDZ initialization error detected. Clearing caches + forcing reload...');
      try {
        // Best-effort: clear CacheStorage (SW + page cache)
        if ('caches' in window) {
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
        }

        // Best-effort: ask SW to clear its caches and unregister
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration?.().then(async (reg) => {
            try {
              reg?.active?.postMessage({ type: 'CLEAR_CACHE' });
            } catch {}
            try {
              await reg?.unregister?.();
            } catch {}
          }).catch(() => {});
        }
      } catch {}

      // Cache-busting reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('__reload', String(Date.now()));
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {error?.message || "An unexpected error occurred. Please try again."}
          </p>
          <div className="space-y-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
          {import.meta.env.DEV && error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundary;
