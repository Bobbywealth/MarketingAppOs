import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, TrendingUp, Calendar, Shield, UserCog, User } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
            Marketing Team App CRM
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            The complete CRM solution for digital marketing agencies
          </p>
          <a href="/api/login">
            <Button size="lg" className="text-lg px-8" data-testid="button-login">
              Login to Continue
            </Button>
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            Access for Admins, Staff Members, and Clients
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 hover-elevate">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-10 h-10 text-primary" />
                <Badge variant="default">Admin</Badge>
              </div>
              <h3 className="text-xl font-semibold mb-3">Admin Access</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Full system access</li>
                <li>• Manage all clients and staff</li>
                <li>• Configure billing and invoices</li>
                <li>• View all analytics and reports</li>
                <li>• System administration</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover-elevate">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <UserCog className="w-10 h-10 text-primary" />
                <Badge variant="secondary">Staff</Badge>
              </div>
              <h3 className="text-xl font-semibold mb-3">Staff Member</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Manage assigned clients</li>
                <li>• Create and track campaigns</li>
                <li>• Handle support tickets</li>
                <li>• Collaborate on tasks</li>
                <li>• Content management</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover-elevate">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <User className="w-10 h-10 text-primary" />
                <Badge variant="outline">Client</Badge>
              </div>
              <h3 className="text-xl font-semibold mb-3">Client Portal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View campaign performance</li>
                <li>• Approve content posts</li>
                <li>• Submit support tickets</li>
                <li>• Access invoices and billing</li>
                <li>• Track project progress</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="hover-elevate transition-shadow">
            <CardContent className="pt-6">
              <LayoutDashboard className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unified Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Monitor all your clients, campaigns, and metrics in one place
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-shadow">
            <CardContent className="pt-6">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Client Management</h3>
              <p className="text-sm text-muted-foreground">
                Track client information, documents, and communication history
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-shadow">
            <CardContent className="pt-6">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sales Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                Manage leads from first contact to closed deals with Kanban boards
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-shadow">
            <CardContent className="pt-6">
              <Calendar className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content Calendar</h3>
              <p className="text-sm text-muted-foreground">
                Schedule posts and manage client approvals seamlessly
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Whether you're an admin setting up your team, a staff member managing clients, or a client checking your campaigns - login to access your personalized dashboard
          </p>
          <a href="/api/login">
            <Button size="lg" data-testid="button-get-started">
              Login Now
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
