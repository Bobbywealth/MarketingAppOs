import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Shield, User, UserPlus, Star, ChevronDown } from "lucide-react";

export function DashboardSwitcher() {
  const [activeRole, setActiveRole] = useState<string | null>(
    localStorage.getItem("admin_role_override")
  );

  const roles = [
    { id: "admin", label: "Admin View", icon: Shield },
    { id: "client", label: "Client View", icon: User },
    { id: "sales_agent", label: "Sales Agent View", icon: UserPlus },
    { id: "creator", label: "Creator View", icon: Star },
  ];

  const handleRoleChange = (roleId: string) => {
    if (roleId === "admin") {
      localStorage.removeItem("admin_role_override");
      setActiveRole(null);
    } else {
      localStorage.setItem("admin_role_override", roleId);
      setActiveRole(roleId);
    }
    window.location.reload();
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



