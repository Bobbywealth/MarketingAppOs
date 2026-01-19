import { useAuth } from "./use-auth";
import type { SidebarPermissionKey } from "@/data/sidebar-items";
import { getEffectiveRole } from "@/lib/effective-role";

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
  // NOTE: this is the canonical effective role for UI gating across the app.
  // If a non-admin has an override lingering, it is cleared.
  const role = getEffectiveRole((user as any)?.role);
  
  const customSidebarPermissions = (user as any)?.customPermissions as Record<string, boolean> | undefined;
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isSalesAgent = role === "sales_agent";
  const isCreatorManager = role === "creator_manager";
  const isCreator = role === "creator";
  const isStaffContentCreator = role === "staff_content_creator";
  const isClient = role === "client";
  const isProspectiveClient = role === "prospective_client";

  // Compute permissions based on role (matches server/rbac.ts)
  const permissions: RolePermissions = {
    canManageUsers: isAdmin,
    canManageClients: isAdmin || isManager || isStaff || isSalesAgent || isCreatorManager || isStaffContentCreator,
    canManageCampaigns: isAdmin || isManager || isStaff,
    canManageLeads: isAdmin || isManager || isStaff || isSalesAgent,
    canManageContent: isAdmin || isManager || isStaff || isCreatorManager || isCreator || isStaffContentCreator,
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
    isStaffContentCreator,
    isClient,
    isProspectiveClient,
    canAccess: (permission: keyof RolePermissions) => permissions[permission],
    canSeeSidebarItem,
  };
}
