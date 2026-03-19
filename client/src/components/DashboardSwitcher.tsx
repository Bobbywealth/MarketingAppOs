import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Shield, User, UserPlus, Star, ChevronDown, Users } from "lucide-react";

export function DashboardSwitcher() {
  const [activeRole, setActiveRole] = useState<string | null>(
    localStorage.getItem("admin_role_override")
  );
  const [, setLocation] = useLocation();

  const roles = [
    { id: "admin", label: "Admin View", icon: Shield, path: "/dashboard" },
    { id: "staff", label: "Staff View", icon: Users, path: "/dashboard-staff" },
    { id: "client", label: "Client View", icon: User, path: "/dashboard-client" },
    { id: "sales_agent", label: "Sales Agent View", icon: UserPlus, path: "/dashboard-sales" },
    { id: "creator", label: "Creator View", icon: Star, path: "/dashboard-creator" },
  ];

  const handleRoleChange = (roleId: string) => {
    if (roleId === "admin") {
      localStorage.removeItem("admin_role_override");
      setActiveRole(null);
    } else {
      localStorage.setItem("admin_role_override", roleId);
      setActiveRole(roleId);
    }
    // Find the target path and navigate without full page reload
    const targetRole = roles.find((r) => r.id === roleId);
    if (targetRole) {
      setLocation(targetRole.path);
    } else {
      // Default to admin dashboard
      setLocation("/dashboard");
    }
  };

  const currentRoleLabel = roles.find((r) => r.id === (activeRole || "admin"))?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline font-medium">{currentRoleLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Dashboard View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.id}
            onClick={() => handleRoleChange(role.id)}
            className="gap-2 cursor-pointer"
          >
            <role.icon className={`h-4 w-4 ${activeRole === role.id || (!activeRole && role.id === 'admin') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={activeRole === role.id || (!activeRole && role.id === 'admin') ? 'font-bold' : ''}>
              {role.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



