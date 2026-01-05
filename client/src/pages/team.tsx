import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { sidebarPermissionList } from "@/data/sidebar-items";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Pencil, Trash2, Shield, Users as UsersIcon, CheckCircle2, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  customPermissions?: Record<string, boolean>;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface NewUser {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

const SIDEBAR_PERMISSIONS = sidebarPermissionList;
type PermissionOption = (typeof SIDEBAR_PERMISSIONS)[number];

export default function UserManagementPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionsDialogUser, setPermissionsDialogUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [newUser, setNewUser] = useState<NewUser>({
    username: "",
    password: "",
    role: "staff",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDialogOpen(false);
      setNewUser({ username: "", password: "", role: "staff" });
      toast({
        title: "User created",
        description: "New user account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "User updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserPermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: Record<string, boolean> }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/permissions`, { customPermissions: permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setPermissionsDialogUser(null);
      toast({
        title: "Permissions updated",
        description: "User sidebar permissions have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      // If response has error details, extract them
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete user (${response.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User account has been removed successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Delete user error:", error);
      toast({
        title: "Failed to delete user",
        description: error?.message || "An error occurred while deleting the user. Check server logs for details.",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default",
      staff: "secondary",
      sales_agent: "default",
      client: "outline",
      creator: "secondary",
    };
    const displayNames: Record<string, string> = {
      admin: "Admin",
      manager: "Manager",
      staff: "Staff",
      sales_agent: "Sales Agent",
      client: "Client",
      creator: "Creator",
    };
    return (
      <Badge variant={variants[role] || "outline"}>
        {displayNames[role] || role}
      </Badge>
    );
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    if (!permissionsDialogUser) return;
    
    const currentPermissions = permissionsDialogUser.customPermissions || {};
    const updatedPermissions = {
      ...currentPermissions,
      [permissionKey]: checked,
    };
    setPermissionsDialogUser({
      ...permissionsDialogUser,
      customPermissions: updatedPermissions,
    });

    updateUserPermissionsMutation.mutate({
      userId: permissionsDialogUser.id,
      permissions: updatedPermissions,
    });
  };

  const isPermissionChecked = (permissionKey: string) => {
    if (!permissionsDialogUser) return false;
    return permissionsDialogUser.customPermissions?.[permissionKey] ?? true; // Default to true
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, PermissionOption[]> = {};
    SIDEBAR_PERMISSIONS.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  // All available permissions
  // Role permissions are now hardcoded in server/rbac.ts and client/src/hooks/usePermissions.ts
  // Permissions are automatically assigned based on user role

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">User Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage all user accounts, roles, and permissions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account and assign their role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName || ""}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName || ""}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email || ""}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full Access</SelectItem>
                      <SelectItem value="manager">Manager - Advanced Access</SelectItem>
                      <SelectItem value="staff">Staff - Standard Access</SelectItem>
                      <SelectItem value="sales_agent">Sales Agent - Leads & Clients</SelectItem>
                      <SelectItem value="creator">Creator - Content Fulfillment</SelectItem>
                      <SelectItem value="client">Client - External Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <UsersIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "manager").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <UsersIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "sales_agent").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "staff").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <UsersIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "client").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creators</CardTitle>
            <UsersIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "creator").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage all user accounts across the platform</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="sales_agent">Sales Agents</SelectItem>
                <SelectItem value="creator">Creators</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter(user => roleFilter === "all" || user.role === roleFilter)
                  .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.username}</div>
                      {(user.firstName || user.lastName) && (
                        <div className="text-sm text-muted-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                      )}
                      {user.email && (
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* Sidebar Permissions Button */}
                      <Dialog
                        open={permissionsDialogUser?.id === user.id}
                        onOpenChange={(open) => {
                          if (!open && permissionsDialogUser?.id === user.id) {
                            setPermissionsDialogUser(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPermissionsDialogUser(user)}
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        {permissionsDialogUser?.id === user.id && (
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Sidebar Permissions - {user.username}</DialogTitle>
                            <DialogDescription>
                              Control which sidebar menu items {user.username} can see and access.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                              <div key={category} className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                  {category}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {permissions.map((permission) => (
                                    <div key={permission.key} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${user.id}-${permission.key}`}
                                        checked={isPermissionChecked(permission.key)}
                                        onCheckedChange={(checked) => 
                                          handlePermissionChange(permission.key, checked as boolean)
                                        }
                                        disabled={updateUserPermissionsMutation.isPending}
                                      />
                                      <Label 
                                        htmlFor={`${user.id}-${permission.key}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {permission.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="pt-4 border-t">
                              <p className="text-sm text-muted-foreground">
                                💡 <strong>Tip:</strong> Unchecked items will be hidden from {user.username}'s sidebar. 
                                Role-based permissions still apply - this only controls visibility.
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                        )}
                      </Dialog>

                      {/* Edit Role Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User Role</DialogTitle>
                            <DialogDescription>
                              Change the role for {user.username}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Select
                                defaultValue={user.role}
                                onValueChange={(value) => {
                                  updateUserMutation.mutate({ id: user.id, role: value });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin - Full Access</SelectItem>
                                  <SelectItem value="manager">Manager - Advanced Access</SelectItem>
                                  <SelectItem value="staff">Staff - Standard Access</SelectItem>
                                  <SelectItem value="sales_agent">Sales Agent - Leads & Clients</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${user.username}?`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        disabled={user.role === "admin" && users.filter((u) => u.role === "admin").length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions are now role-based and automatically assigned based on user role */}
      {/* See server/rbac.ts for permission definitions */}
    </div>
  );
}

