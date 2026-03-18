import { QueryFunction } from "@tanstack/react-query";
import { isNativeApp } from "./runtime";
import { clientDebug } from "./debug";

export class ApiError extends Error {
  status: number;
  url: string;

  constructor({ message, status, url }: { message: string; status: number; url: string }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function getSafeErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const record = asRecord(error);
  const fromMessage = record?.message;
  if (typeof fromMessage === "string" && fromMessage.trim().length > 0) {
    return fromMessage;
  }

  const fromError = record?.error;
  if (typeof fromError === "string" && fromError.trim().length > 0) {
    return fromError;
  }

  return fallback;
}

function getApiBaseUrl(): string {
  const fromEnv = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  // When bundled into a native app, the WebView origin becomes `capacitor://localhost`,
  // so relative `/api/*` calls won't reach your hosted backend unless we pin a base URL.
  if (isNativeApp()) return "https://www.marketingteam.app";

  // In normal web/PWA mode, keep relative URLs so same-origin cookies/sessions work.
  return "";
}

export function resolveApiUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const base = getApiBaseUrl();
  if (!base) return url;

  return new URL(url, base).toString();
}

async function throwIfResNotOk(res: Response, url?: string) {
  if (!res.ok) {
    let errorMessage = res.statusText || "Request failed";
    const safeUrl = typeof url === "string" && url.trim().length > 0 ? url : res.url || "unknown";

    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = asRecord(JSON.parse(text));
          errorMessage =
            (typeof parsed?.message === "string" && parsed.message) ||
            (typeof parsed?.error === "string" && parsed.error) ||
            text;
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
        // For login endpoints, show the actual error message (e.g., "Invalid username or password")
        // For other endpoints, show the generic message
        if (typeof url === "string" && url.includes('/api/login')) {
          throw new ApiError({
            message: errorMessage || "Invalid username or password",
            status: res.status,
            url: safeUrl,
          });
        }
        throw new ApiError({
          message: errorMessage || "Authentication required. Please log in again.",
          status: res.status,
          url: safeUrl,
        });
      case 403:
        throw new ApiError({
          message: "You don't have permission to access this resource.",
          status: res.status,
          url: safeUrl,
        });
      case 404:
        throw new ApiError({
          message: "The requested resource was not found.",
          status: res.status,
          url: safeUrl,
        });
      case 500:
        throw new ApiError({
          message: errorMessage || "Server error. Please try again later.",
          status: res.status,
          url: safeUrl,
        });
      case 503:
        throw new ApiError({
          message: "Service temporarily unavailable. Please try again later.",
          status: res.status,
          url: safeUrl,
        });
      default:
        throw new ApiError({
          message: `${res.status}: ${errorMessage}`,
          status: res.status,
          url: safeUrl,
        });
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

  const res = await fetch(resolveApiUrl(url), {
    method,
    headers: isFormData ? {} : (data ? { "Content-Type": "application/json" } : {}),
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  clientDebug.apiRequest(method, url, res.status);

  await throwIfResNotOk(res, url);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;

    const res = await fetch(resolveApiUrl(path), {
      credentials: "include",
    });

    clientDebug.queryFetch(queryKey as string[], res.status);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, path);
    return await res.json();
  };
