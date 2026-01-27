import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/roles";

export { UserRole };

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

export const rolePermissions: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    canManageUsers: true,
    canManageClients: true,
    canManageCampaigns: true,
    canManageLeads: true,
    canManageContent: true,
    canManageInvoices: true,
    canManageTickets: true,
    canViewReports: true,
    canManageSettings: true,
  },
  [UserRole.MANAGER]: {
    canManageUsers: false,
    canManageClients: true,
    canManageCampaigns: true,
    canManageLeads: true,
    canManageContent: true,
    canManageInvoices: true,
    canManageTickets: true,
    canViewReports: true,
    canManageSettings: false,
  },
  [UserRole.STAFF]: {
    canManageUsers: false,
    canManageClients: true,
    canManageCampaigns: true,
    canManageLeads: true,
    canManageContent: true,
    canManageInvoices: false,
    canManageTickets: true,
    canViewReports: false,
    canManageSettings: false,
  },
  [UserRole.SALES_AGENT]: {
    canManageUsers: false,
    canManageClients: true, // Can manage assigned clients only
    canManageCampaigns: false, // View only
    canManageLeads: true, // Can manage assigned leads
    canManageContent: false,
    canManageInvoices: false, // View only for their deals
    canManageTickets: true, // For client support
    canViewReports: false, // Can only view their own performance metrics
    canManageSettings: false,
  },
  [UserRole.CREATOR_MANAGER]: {
    canManageUsers: false,
    canManageClients: true,
    canManageCampaigns: false,
    canManageLeads: false,
    canManageContent: true,
    canManageInvoices: false,
    canManageTickets: false,
    canViewReports: true,
    canManageSettings: false,
  },
  [UserRole.CREATOR]: {
    canManageUsers: false,
    canManageClients: false,
    canManageCampaigns: false,
    canManageLeads: false,
    canManageContent: true, // Creators manage their own content uploads
    canManageInvoices: false,
    canManageTickets: true,
    canViewReports: false,
    canManageSettings: false,
  },
  [UserRole.STAFF_CONTENT_CREATOR]: {
    canManageUsers: false,
    canManageClients: true, // Need access to view all client documents/folders
    canManageCampaigns: false,
    canManageLeads: false,
    canManageContent: true, // Need access to content calendar
    canManageInvoices: false,
    canManageTickets: false,
    canViewReports: false,
    canManageSettings: false,
  },
  [UserRole.CLIENT]: {
    canManageUsers: false,
    canManageClients: false,
    canManageCampaigns: false,
    canManageLeads: false,
    canManageContent: false,
    canManageInvoices: false,
    canManageTickets: true, // Clients can create/view their own tickets
    canViewReports: false,
    canManageSettings: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[role]?.[permission] ?? false;
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Passport already attaches the user object to req.user after deserialization
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Use the already fetched user object from Passport
    if (!allowedRoles.includes(user.role as UserRole)) {
      return res.status(403).json({ 
        message: "Forbidden: Insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: user.role,
      });
    }

    // Attach for convenience
    (req as any).userRole = user.role;
    (req as any).userId = user.id;

    next();
  };
}

export function requirePermission(permission: keyof RolePermissions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!hasPermission(user.role as UserRole, permission)) {
      return res.status(403).json({ 
        message: `Forbidden: Missing permission '${permission}'`,
        userRole: user.role,
      });
    }

    (req as any).userRole = user.role;
    (req as any).userId = user.id;

    next();
  };
}
