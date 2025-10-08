import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Users, TrendingUp, Calendar } from "lucide-react";

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
              Get Started
            </Button>
          </a>
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
          <h2 className="text-2xl font-bold mb-4">Ready to transform your agency?</h2>
          <p className="text-muted-foreground mb-6">
            Join hundreds of marketing teams using MTA CRM to streamline their workflow
          </p>
          <a href="/api/login">
            <Button size="lg" data-testid="button-get-started">
              Start Free Trial
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
