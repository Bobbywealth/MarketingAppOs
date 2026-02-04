import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface LogEntry {
  timestamp: number;
  level: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
}

export default function AdminDebugLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Only allow admins
  if (!user || user.role !== "admin") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be an admin to view debug logs.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/debug/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = filter === "all"
    ? logs
    : logs.filter(log => log.level === filter);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-500";
      case "warn": return "text-yellow-500";
      case "info": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Debug Logs</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors Only</option>
            <option value="warn">Warnings Only</option>
            <option value="debug">Debug Only</option>
          </select>
          <button
            onClick={fetchLogs}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-auto max-h-[70vh]">
        {isLoading ? (
          <p>Loading logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p>No logs found. Start using the app to see debug entries here.</p>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="mb-2 border-b border-gray-800 pb-2">
              <span className="text-gray-500">[{formatTime(log.timestamp)}]</span>{" "}
              <span className={getLevelColor(log.level)}>[{log.level.toUpperCase()}]</span>{" "}
              <span className="text-yellow-300">[{log.location}]</span>{" "}
              <span className="text-white">{log.message}</span>
              {log.data && (
                <pre className="text-gray-400 mt-1 ml-4 text-xs">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Logs are collected from both server and client. Client logs are sent via the /api/debug/log endpoint.</p>
        <p>Tip: Check your deployment platform's log viewer (Render, Railway, etc.) for production logs written to stdout.</p>
      </div>
    </div>
  );
}
