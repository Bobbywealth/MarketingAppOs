import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.message || parsed.error || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // If we can't read the response, use status text
    }
    
    // Provide user-friendly error messages for common status codes
    switch (res.status) {
      case 401:
        throw new Error("Authentication required. Please log in again.");
      case 403:
        throw new Error("You don't have permission to access this resource.");
      case 404:
        throw new Error("The requested resource was not found.");
      case 500:
        throw new Error("Server error. Please try again later.");
      case 503:
        throw new Error("Service temporarily unavailable. Please try again later.");
      default:
        throw new Error(`${res.status}: ${errorMessage}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if data is FormData (for file uploads)
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    headers: isFormData ? {} : (data ? { "Content-Type": "application/json" } : {}),
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Optimized Query Client for BLAZING FAST performance! 🚀
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Smart caching - data is considered fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Keep inactive queries in cache for 5 minutes
      cacheTime: 5 * 60 * 1000,
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
