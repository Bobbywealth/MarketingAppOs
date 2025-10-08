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

  const permissions: RolePermissions = (user as any)?.permissions || {
    canManageUsers: false,
    canManageClients: false,
    canManageCampaigns: false,
    canManageLeads: false,
    canManageContent: false,
    canManageInvoices: false,
    canManageTickets: false,
    canViewReports: false,
    canManageSettings: false,
  };

  const role = (user as any)?.role || "staff";
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isClient = role === "client";

  return {
    permissions,
    role,
    isAdmin,
    isStaff,
    isClient,
    canAccess: (permission: keyof RolePermissions) => permissions[permission],
  };
}
