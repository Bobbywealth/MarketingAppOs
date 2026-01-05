import { QueryClient } from "@tanstack/react-query";
import { getQueryFn } from "./api";

// Optimized Query Client for BLAZING FAST performance! 🚀
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Smart caching - data is considered fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Keep inactive queries in cache for 5 minutes (TanStack v5 uses gcTime)
      gcTime: 5 * 60 * 1000,
      // Auto-refresh when you switch back to the tab (for real-time updates)
      refetchOnWindowFocus: true,
      // Don't refetch on component mount if data is fresh
      refetchOnMount: false,
      // Don't auto-refresh by interval (we use manual refresh buttons)
      refetchInterval: false,
      retry: (failureCount, error: any) => {
        // Don't retry on client errors (4xx) or auth errors
        const status = error?.status;
        if (status && status >= 400 && status < 500) return false;
        
        // Retry server errors (5xx) or network errors up to 3 times
        if (!status || (status >= 500 && status <= 504)) {
          return failureCount < 3;
        }
        
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        const status = error?.status;
        if (status && status >= 400 && status < 500) return false;
        
        // Retry server errors once for safety
        if (!status || (status >= 500 && status <= 504)) {
          return failureCount < 1;
        }
        
        return false;
      },
    },
  },
});

export { apiRequest, getQueryFn } from "./api";
