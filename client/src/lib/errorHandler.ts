import { toast } from "@/hooks/use-toast";

/**
 * Error handler utility for consistent error handling across the app
 * Logs errors and shows user-friendly toast notifications
 */
export function handleError(error: unknown, context?: string): void {
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log to console for debugging
  console.error(`[Error${context ? ` - ${context}` : ""}]:`, errorMessage, errorStack);

  // Show toast notification to user
  toast({
    title: "Error",
    description: context ? `${context}: ${errorMessage}` : errorMessage,
    variant: "destructive",
  });
}

/**
 * Wrapper for async operations that shows loading toast and handles errors
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  options: {
    loadingMessage?: string;
    successMessage?: string;
    errorContext?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<T | null> {
  const { loadingMessage, successMessage, errorContext, onSuccess, onError } = options;

  if (loadingMessage) {
    toast({
      title: "Loading...",
      description: loadingMessage,
    });
  }

  try {
    const result = await asyncFn();

    if (successMessage) {
      toast({
        title: "Success",
        description: successMessage,
        variant: "default",
      });
    }

    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (error) {
    handleError(error, errorContext);

    if (onError) {
      onError(error);
    }

    return null;
  }
}

/**
 * Safe async wrapper that catches and logs errors without throwing
 */
export function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorContext?: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  return asyncFn
    .then((data) => ({ success: true, data }))
    .catch((error) => {
      handleError(error, errorContext);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    });
}

/**
 * Log error to console with context
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`[${timestamp}] [Error${context ? ` - ${context}` : ""}]:`, {
    message,
    stack,
    error,
  });
}
