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
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx) or auth errors
        if (error instanceof Error && error.message.includes('401')) return false;
        if (error instanceof Error && error.message.includes('403')) return false;
        if (error instanceof Error && error.message.includes('404')) return false;
        
        // Retry server errors (5xx) up to 2 times
        if (error instanceof Error && (error.message.includes('500') || error.message.includes('503'))) {
          return failureCount < 2;
        }
        
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error instanceof Error && error.message.includes('4')) return false;
        
        // Retry server errors once
        if (error instanceof Error && (error.message.includes('500') || error.message.includes('503'))) {
          return failureCount < 1;
        }
        
        return false;
      },
    },
  },
});

export { apiRequest, getQueryFn } from "./api";
