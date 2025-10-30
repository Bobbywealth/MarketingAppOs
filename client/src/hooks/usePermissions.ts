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
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isClient = role === "client";

  // Compute permissions based on role (matches server/rbac.ts)
  const permissions: RolePermissions = {
    canManageUsers: isAdmin,
    canManageClients: isAdmin || isManager || isStaff,
    canManageCampaigns: isAdmin || isManager || isStaff,
    canManageLeads: isAdmin || isManager || isStaff,
    canManageContent: isAdmin || isManager || isStaff,
    canManageInvoices: isAdmin || isManager, // Staff cannot manage invoices
    canManageTickets: isAdmin || isManager || isStaff,
    canViewReports: isAdmin || isManager, // Staff cannot view reports
    canManageSettings: isAdmin,
  };

  return {
    permissions,
    role,
    isAdmin,
    isManager,
    isStaff,
    isClient,
    canAccess: (permission: keyof RolePermissions) => permissions[permission],
  };
}
