import { appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";

// Determine log path - use stdout in production, file locally
const isProduction = process.env.NODE_ENV === "production";
const DEBUG_LOG_PATH = process.env.DEBUG_LOG_PATH || "./debug.log";

export interface LogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  location: string;
  message: string;
  data?: Record<string, unknown>;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}

function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, location, message, data } = entry;
  const time = new Date(timestamp).toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `[${time}] [${level.toUpperCase().padEnd(5)}] [${location}] ${message}${dataStr}`;
}

export function debugLog(payload: Omit<LogEntry, "timestamp">): void {
  const entry: LogEntry = {
    timestamp: Date.now(),
    ...payload,
  };

  const formatted = formatLogEntry(entry);

  if (isProduction) {
    // In production, write to stdout for platform logging (Render, Railway, etc.)
    process.stdout.write(formatted + "\n");
  } else {
    // Locally, write to file for easy debugging
    appendFile(DEBUG_LOG_PATH, JSON.stringify(entry) + "\n").catch(() => {});
  }
}

// Helper for auth-specific logging
export const authDebug = {
  loginAttempt: (username: string, origin?: string) =>
    debugLog({
      level: "debug",
      location: "auth:login",
      message: "Login attempt",
      data: { username: username.slice(0, 50), origin },
    }),

  loginSuccess: (userId: number, sessionId: string) =>
    debugLog({
      level: "debug",
      location: "auth:login",
      message: "Login successful",
      data: { userId, sessionId },
    }),

  loginFailed: (reason: string, ip?: string) =>
    debugLog({
      level: "warn",
      location: "auth:login",
      message: "Login failed",
      data: { reason, ip },
    }),

  sessionDeserialize: (userId: string, found: boolean) =>
    debugLog({
      level: "debug",
      location: "auth:session",
      message: "Session deserialize",
      data: { userId, found },
    }),

  sessionNotAuthenticated: (sessionId: string, hasCookie: boolean) =>
    debugLog({
      level: "info",
      location: "auth:session",
      message: "User not authenticated",
      data: { sessionId, hasCookie },
    }),

  sessionAuthenticated: (userId: number, sessionId: string) =>
    debugLog({
      level: "debug",
      location: "auth:session",
      message: "User authenticated",
      data: { userId, sessionId },
    }),

  logout: (userId?: number) =>
    debugLog({
      level: "debug",
      location: "auth:logout",
      message: "Logout",
      data: { userId },
    }),

  apiRequest: (method: string, url: string, status?: number) =>
    debugLog({
      level: "debug",
      location: "api",
      message: `${method} ${url}`,
      data: { status },
    }),

  cookieIssue: (reason: string, cookies?: string) =>
    debugLog({
      level: "warn",
      location: "auth:cookie",
      message: "Cookie issue",
      data: { reason, hasCookies: !!cookies },
    }),
};
