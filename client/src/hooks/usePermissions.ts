import { useAuth } from "./useAuth";

export interface RolePermissions {
  canManageUsers: boolean;
  canManageClients: boolean;
  canManageCampaigns: boolean;
  canManageLeads: boolean;
  canManageContent: boolean;
  canManageInvoices: boolean;
  canManageTickets: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

export function usePermissions() {
  const { user } = useAuth();

  const role = (user as any)?.role || "staff";
  const isAdmin = role === "admin";
  const isStaff = role === "staff" || role === "admin"; // Admin has staff permissions
  const isClient = role === "client";

  // Compute permissions based on role
  const permissions: RolePermissions = {
    canManageUsers: isAdmin,
    canManageClients: isAdmin || isStaff,
    canManageCampaigns: isAdmin || isStaff,
    canManageLeads: isAdmin || isStaff,
    canManageContent: isAdmin || isStaff,
    canManageInvoices: isAdmin || isStaff,
    canManageTickets: isAdmin || isStaff,
    canViewReports: isAdmin || isStaff,
    canManageSettings: isAdmin,
  };

  return {
    permissions,
    role,
    isAdmin,
    isStaff,
    isClient,
    canAccess: (permission: keyof RolePermissions) => permissions[permission],
  };
}
