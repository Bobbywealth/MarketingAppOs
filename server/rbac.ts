import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/schema";

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
    const user = req.user as any;
    
    // Support both Passport (user.id) and Replit Auth (user.claims.sub)
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { storage } = await import("./storage");
    const dbUser = await storage.getUser(userId.toString());
    
    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!allowedRoles.includes(dbUser.role as UserRole)) {
      return res.status(403).json({ 
        message: "Forbidden: Insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: dbUser.role,
      });
    }

    // Attach user role to request for later use
    (req as any).userRole = dbUser.role;
    (req as any).userId = dbUser.id;

    next();
  };
}

export function requirePermission(permission: keyof RolePermissions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    // Support both Passport (user.id) and Replit Auth (user.claims.sub)
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { storage } = await import("./storage");
    const dbUser = await storage.getUser(userId.toString());
    
    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!hasPermission(dbUser.role as UserRole, permission)) {
      return res.status(403).json({ 
        message: `Forbidden: Missing permission '${permission}'`,
        userRole: dbUser.role,
      });
    }

    (req as any).userRole = dbUser.role;
    (req as any).userId = dbUser.id;

    next();
  };
}
