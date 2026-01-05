import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  BarChart3, 
  Target,
  Rocket,
  Zap,
  Megaphone,
  Palette,
  ShieldCheck,
  ArrowRight,
  Globe,
  Smartphone,
  CheckCircle2,
  Cpu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  useDocumentMeta({
    title: "Login | Marketing Team App",
    description: "Securely sign in to your Marketing Team App account to manage clients, campaigns, content and more."
  });
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
    <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden bg-slate-50">
      {/* Left Column: Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Animated Blobs for "Vibes" */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <motion.div 
            animate={{ 
              x: [0, 30, 0],
              y: [0, 50, 0],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, -30, 0],
              y: [0, -50, 0],
              rotate: [0, -45, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Link href="/">
                <Logo size="lg" className="scale-110 cursor-pointer" />
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-3 text-slate-900 tracking-tight">
              Marketing Team App
            </h1>
            <p className="text-slate-500 font-medium">
              Your Elite, High-Speed Marketing Department
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100/50 p-1 rounded-xl ring-1 ring-slate-200">
              <TabsTrigger 
                value="login" 
                data-testid="tab-login"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                data-testid="tab-register"
                className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
              >
                Join Now
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="login">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden ring-1 ring-slate-200">
                    <CardHeader className="space-y-1 pb-4">
                      <CardTitle className="text-2xl font-black">Welcome Back</CardTitle>
                      <CardDescription className="text-slate-500 font-medium">
                        Access your global marketing dashboard
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="login-username" className="text-sm font-bold text-slate-700">Email or Username</Label>
                          <Input
                            id="login-username"
                            data-testid="input-login-username"
                            type="text"
                            placeholder="you@example.com"
                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password" title="Password" className="text-sm font-bold text-slate-700">Password</Label>
                            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="p-0 h-auto text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-transparent"
                                  type="button"
                                >
                                  Forgot?
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-2xl max-w-[400px]">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-black">Reset Password</DialogTitle>
                                  <DialogDescription className="font-medium text-slate-500">
                                    We'll send a secure link to your email.
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="reset-email" className="font-bold text-slate-700">Email Address</Label>
                                    <Input
                                      id="reset-email"
                                      type="email"
                                      placeholder="you@example.com"
                                      className="h-12 rounded-xl border-slate-200"
                                      value={resetEmail}
                                      onChange={(e) => setResetEmail(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="flex flex-col gap-2 pt-2">
                                    <Button type="submit" disabled={isResetting} className="h-12 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-700">
                                      {isResetting ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-12 rounded-xl font-bold text-slate-500"
                                      onClick={() => setResetDialogOpen(false)}
                                    >
                                      Cancel
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
                            placeholder="••••••••"
                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-500 transition-all"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 rounded-xl font-black text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 transition-all"
                          disabled={loginMutation.isPending}
                          data-testid="button-login-submit"
                        >
                          {loginMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Logging in...
                            </div>
                          ) : "Login"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="register">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden ring-1 ring-slate-200">
                    <CardHeader className="space-y-1 pb-4">
                      <CardTitle className="text-2xl font-black">Get Started</CardTitle>
                      <CardDescription className="text-slate-500 font-medium">
                        Join the world's most advanced marketing engine
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <p className="font-black text-blue-900 text-sm tracking-tight">Are you a Content Creator?</p>
                        </div>
                        <p className="text-blue-700/70 text-[13px] font-medium leading-snug mb-3">
                          Join our elite network to get paid for high-impact content captures.
                        </p>
                        <Link href="/signup/creator">
                          <Button variant="outline" size="sm" className="w-full rounded-lg border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold text-xs h-9 shadow-sm">
                            Apply To Creator Network →
                          </Button>
                        </Link>
                      </div>

                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-slate-200"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
                          <span className="bg-white px-4">Or Create Client Account</span>
                        </div>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-username" className="text-sm font-bold text-slate-700">Username</Label>
                          <Input
                            id="register-username"
                            data-testid="input-register-username"
                            type="text"
                            placeholder="choose_a_username"
                            className="h-12 rounded-xl border-slate-200"
                            value={registerData.username}
                            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email" className="text-sm font-bold text-slate-700">Email</Label>
                          <Input
                            id="register-email"
                            data-testid="input-register-email"
                            type="email"
                            placeholder="you@example.com"
                            className="h-12 rounded-xl border-slate-200"
                            value={registerData.email || ""}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="register-firstName" className="text-sm font-bold text-slate-700">First Name</Label>
                            <Input
                              id="register-firstName"
                              data-testid="input-register-firstname"
                              type="text"
                              placeholder="John"
                              className="h-12 rounded-xl border-slate-200"
                              value={registerData.firstName || ""}
                              onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="register-lastName" className="text-sm font-bold text-slate-700">Last Name</Label>
                            <Input
                              id="register-lastName"
                              data-testid="input-register-lastname"
                              type="text"
                              placeholder="Doe"
                              className="h-12 rounded-xl border-slate-200"
                              value={registerData.lastName || ""}
                              onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password" title="Password" className="text-sm font-bold text-slate-700">Password</Label>
                          <Input
                            id="register-password"
                            data-testid="input-register-password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            className="h-12 rounded-xl border-slate-200"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            required
                            minLength={8}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 rounded-xl font-black text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 transition-all"
                          disabled={registerMutation.isPending}
                          data-testid="button-register-submit"
                        >
                          {registerMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating Account...
                            </div>
                          ) : "Launch Account"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              Secure Enterprise Encryption
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Vibe & Energy */}
      <div className="hidden lg:flex flex-1 bg-slate-950 relative overflow-hidden items-center justify-center p-12">
        {/* Energetic Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] -mr-96 -mt-96" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] -ml-48 -mb-48" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 max-w-xl w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
              >
                <Sparkles className="w-4 h-4" />
                The Future of Marketing is Here
              </motion.div>
              
              <h2 className="text-5xl md:text-6xl font-black leading-tight text-white tracking-tighter">
                Scale Your <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Brand</span> <br />
                at Warp Speed.
              </h2>
              
              <p className="text-slate-400 text-xl font-medium leading-relaxed">
                Stop wasting money on marketing that doesn't work. Get an elite, high-speed marketing department that lives inside your business.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Viral Growth", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "AI Content", icon: Cpu, color: "text-purple-400", bg: "bg-purple-400/10" },
                { label: "Brand Domination", icon: Palette, color: "text-orange-400", bg: "bg-orange-400/10" },
                { label: "Global Reach", icon: Globe, color: "text-green-400", bg: "bg-green-400/10" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl group hover:bg-white/10 transition-all cursor-default"
                >
                  <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-black text-lg tracking-tight">{item.label}</h3>
                  <div className="flex gap-1 mt-2">
                    {[1,2,3].map(s => <div key={s} className="h-1 w-4 bg-white/10 rounded-full" />)}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="pt-8 border-t border-white/10"
            >
              <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <Megaphone className="w-24 h-24 -rotate-12" />
                </div>
                <div className="flex-1 relative z-10">
                  <p className="text-white font-bold italic text-lg leading-snug">
                    "Our e-commerce sales tripled after Marketing Team App revamped our strategy. The ROI has been insane!"
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-xs">SM</div>
                    <div>
                      <p className="text-white font-black text-sm">Sarah Mitchell</p>
                      <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Fashion Brand Owner</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-4">
                <span>SEO</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>PPC</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>SOCIAL</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>UGC</span>
              </div>
              <p>© 2025 MARKETING TEAM APP</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

