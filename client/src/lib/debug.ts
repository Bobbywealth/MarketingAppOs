// Client-side debug logging utility
// Logs are sent to the server's debug endpoint

interface ClientLogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  location: string;
  message: string;
  data?: Record<string, unknown>;
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

  loginStart: (username: string) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:auth",
      message: "Login started",
      data: { username: username.slice(0, 50) },
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

  apiRequest: (method: string, url: string, status?: number) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:api",
      message: `${method} ${url}`,
      data: { status },
    };

    if (import.meta.env.DEV && status && status >= 400) {
      console.warn(`[DEBUG] ${entry.message}`, entry.data);
    }

    sendLogToServer(entry);
  },

  queryFetch: (queryKey: string[], status?: number) => {
    const entry: ClientLogEntry = {
      timestamp: Date.now(),
      level: "debug",
      location: "client:query",
      message: `Query fetch: ${queryKey.join("/")}`,
      data: { status },
    };

    sendLogToServer(entry);
  },
};
