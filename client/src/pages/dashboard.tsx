import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultDashboardPath, getEffectiveRole } from "@/lib/effective-role";

/**
 * /dashboard
 * Redirects authenticated users to their role-appropriate dashboard.
 */
export default function DashboardRedirect() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const role = getEffectiveRole((user as any)?.role);
    setLocation(getDefaultDashboardPath(role));
  }, [setLocation, user]);

  return null;
}
