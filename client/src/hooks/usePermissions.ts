import { useAuth } from "./useAuth";
import type { SidebarPermissionKey } from "@/data/sidebar-items";

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

  // Role override for testing
  const overrideRole = localStorage.getItem('admin_role_override');
  const role = (user?.role === 'admin' && overrideRole) ? overrideRole : (user as any)?.role || "staff";
  
  const customSidebarPermissions = (user as any)?.customPermissions as Record<string, boolean> | undefined;
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isSalesAgent = role === "sales_agent";
  const isCreatorManager = role === "creator_manager";
  const isCreator = role === "creator";
  const isClient = role === "client";

  // Compute permissions based on role (matches server/rbac.ts)
  const permissions: RolePermissions = {
    canManageUsers: isAdmin,
    canManageClients: isAdmin || isManager || isStaff || isSalesAgent || isCreatorManager,
    canManageCampaigns: isAdmin || isManager || isStaff,
    canManageLeads: isAdmin || isManager || isStaff || isSalesAgent,
    canManageContent: isAdmin || isManager || isStaff || isCreatorManager || isCreator,
    canManageInvoices: isAdmin || isManager, // Staff and sales agents cannot manage invoices
    canManageTickets: isAdmin || isManager || isStaff || isSalesAgent || isCreator || isClient,
    canViewReports: isAdmin || isManager || isCreatorManager, // Staff and sales agents cannot view full reports
    canManageSettings: isAdmin,
  };

  const canSeeSidebarItem = (key?: SidebarPermissionKey) => {
    if (!key) return true;
    if (customSidebarPermissions && Object.prototype.hasOwnProperty.call(customSidebarPermissions, key)) {
      return Boolean(customSidebarPermissions[key]);
    }
    return true;
  };

  return {
    permissions,
    role,
    isAdmin,
    isManager,
    isStaff,
    isSalesAgent,
    isCreatorManager,
    isCreator,
    isClient,
    canAccess: (permission: keyof RolePermissions) => permissions[permission],
    canSeeSidebarItem,
  };
}
