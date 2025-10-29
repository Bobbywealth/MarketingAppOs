import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LayoutDashboard, Users, TrendingUp, Calendar, Sparkles, BarChart3, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function AuthPage() {
  useDocumentMeta(
    "Login | Marketing Team App",
    "Securely sign in to your Marketing Team App account to manage clients, campaigns, content and more."
  );
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", {
        email: resetEmail,
      });

      toast({
        title: "✅ Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
      setResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              Marketing Team App
            </h1>
            <p className="text-muted-foreground text-sm">
              Your Complete Marketing & CRM Solution
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs text-primary hover:underline"
                              type="button"
                            >
                              Forgot password?
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>
                                Enter your email address and we'll send you instructions to reset your password.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <Input
                                  id="reset-email"
                                  type="email"
                                  placeholder="you@example.com"
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="flex gap-3 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setResetDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isResetting}>
                                  {isResetting ? "Sending..." : "Send Reset Link"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Input
                        id="login-password"
                        data-testid="input-login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>
                    Create a new account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        data-testid="input-register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        data-testid="input-register-email"
                        type="email"
                        value={registerData.email || ""}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName">First Name</Label>
                        <Input
                          id="register-firstName"
                          data-testid="input-register-firstname"
                          type="text"
                          value={registerData.firstName || ""}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastName">Last Name</Label>
                        <Input
                          id="register-lastName"
                          data-testid="input-register-lastname"
                          type="text"
                          value={registerData.lastName || ""}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        data-testid="input-register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center p-12">
        <div className="max-w-lg space-y-8 text-white">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted by Marketing Teams Worldwide</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Grow Your Business
            </h2>
            <p className="text-blue-100 text-lg">
              Streamline client relationships, project delivery, and campaign management with the complete CRM built for businesses, influencers, and entrepreneurs.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="flex gap-4 items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Unified Dashboard</h3>
                <p className="text-sm text-blue-100">
                  Real-time insights into campaigns, revenue, and client performance
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Campaign Management</h3>
                <p className="text-sm text-blue-100">
                  Plan, execute, and track marketing campaigns from start to finish
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Analytics & Reporting</h3>
                <p className="text-sm text-blue-100">
                  Data-driven insights to optimize your business performance
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Client Portal</h3>
                <p className="text-sm text-blue-100">
                  Give clients visibility and collaboration on their projects
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <p className="text-sm text-blue-100 italic">
              "This CRM transformed how we manage our business. Game changer!"
            </p>
            <p className="text-xs text-blue-200 mt-2">— Sarah M., Marketing Director</p>
          </div>
        </div>
      </div>
    </div>
  );
}
