// Client-side debug logging utility
// Logs are sent to the server's debug endpoint

interface ClientLogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  location: string;
  message: string;
  data?: Record<string, unknown>;
}

function safeString(value: unknown, fallback = "unknown"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function safeSlice(value: unknown, max = 50): string {
  return safeString(value).slice(0, max);
}

function safeQueryKey(queryKey: unknown): string {
  if (Array.isArray(queryKey)) {
    return queryKey.map((part) => safeString(part, "")).filter(Boolean).join("/");
  }
  return safeString(queryKey);
}

async function sendLogToServer(entry: ClientLogEntry): Promise<void> {
  try {
    await fetch("/api/debug/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      credentials: "include",
    });
  } catch {
    // Silently fail - logging should not break the app
  }
}

export const clientDebug = {
  authStateChange: (userId: number | null | undefined, isLoading: boolean) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:auth",
      message: "Auth state changed",
      data: { userId, isLoading },
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${entry.message}`, entry.data);
    }

    // Send to server
    sendLogToServer(entry);
  },

  loginStart: (username: unknown) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:auth",
      message: "Login started",
      data: { username: safeSlice(username, 50) },
    };

    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${entry.message}`, entry.data);
    }

    sendLogToServer(entry);
  },

  loginSuccess: (userId: number) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:auth",
      message: "Login successful",
      data: { userId },
    };

    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${entry.message}`, entry.data);
    }

    sendLogToServer(entry);
  },

  loginError: (error: string) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "error",
      location: "client:auth",
      message: "Login error",
      data: { error },
    };

    if (import.meta.env.DEV) {
      console.error(`[DEBUG] ${entry.message}`, entry.data);
    }

    sendLogToServer(entry);
  },

  logoutStart: (userId?: number) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:auth",
      message: "Logout started",
      data: { userId },
    };

    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${entry.message}`, entry.data);
    }

    sendLogToServer(entry);
  },

  logoutSuccess: () => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:auth",
      message: "Logout successful",
      data: {},
    };

    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${entry.message}`);
    }

    sendLogToServer(entry);
  },

  apiRequest: (method: unknown, url: unknown, status?: number) => {
    const safeMethod = safeString(method, "UNKNOWN");
    const safeUrl = safeString(url, "unknown-url");
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:api",
      message: `${safeMethod} ${safeUrl}`,
      data: { status },
    };

    if (import.meta.env.DEV && status && status >= 400) {
      console.warn(`[DEBUG] ${entry.message}`, entry.data);
    }

    sendLogToServer(entry);
  },

  queryFetch: (queryKey: unknown, status?: number) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:query",
      message: `Query fetch: ${safeQueryKey(queryKey)}`,
      data: { status },
    };

    sendLogToServer(entry);
  },
};
