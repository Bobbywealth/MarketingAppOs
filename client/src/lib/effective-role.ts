export const VALID_ROLES = [
  "admin",
  "manager",
  "staff",
  "sales_agent",
  "creator_manager",
  "creator",
  "client",
  "prospective_client",
] as const;

export type AppRole = (typeof VALID_ROLES)[number];

function normalizeRole(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isValidRole(value: unknown): value is AppRole {
  const r = normalizeRole(value);
  return (VALID_ROLES as readonly string[]).includes(r);
}

/**
 * Returns the effective role for UI gating.
 * - Admins may simulate other roles via `admin_role_override` (localStorage).
 * - Non-admins cannot use overrides (override will be cleared if present).
 */
export function getEffectiveRole(userRole: unknown): AppRole {
  const baseRole = normalizeRole(userRole);

  // Non-admin should never have an override lingering.
  if (baseRole !== "admin") {
    try {
      if (localStorage.getItem("admin_role_override")) {
        localStorage.removeItem("admin_role_override");
      }
    } catch {}
    return (isValidRole(baseRole) ? (baseRole as AppRole) : "staff");
  }

  // Admin override (simulation mode)
  try {
    const override = localStorage.getItem("admin_role_override");
    if (isValidRole(override) && override !== "admin") {
      return override;
    }
  } catch {}

  return "admin";
}

export function getDefaultDashboardPath(role: AppRole): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "manager" || role === "creator_manager") return "/dashboard/manager";
  if (role === "staff") return "/dashboard/staff";
  if (role === "prospective_client") return "/signup";
  // Other roles still use existing dashboards (root route)
  return "/";
}


