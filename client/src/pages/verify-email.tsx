import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const token = params.get("token");
  const [, setLocation] = useLocation();
  const { user, resendVerificationMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const res = await apiRequest("POST", "/api/auth/verify-email", { token });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || "Email verified successfully!");
        
        // Invalidate user query to refresh verification status
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });

        toast({
          title: "Success",
          description: "Your email has been verified.",
        });
      } else {
        setStatus('error');
        setMessage(data.message || "Invalid or expired token.");
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || "An error occurred during verification.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-12 w-12 text-green-500" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
            {status === 'idle' && <Mail className="h-12 w-12 text-primary" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && "Verifying your email..."}
            {status === 'success' && "Email Verified!"}
            {status === 'error' && "Verification Failed"}
            {status === 'idle' && "Check your email"}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && "Please wait while we verify your email address."}
            {status === 'success' && message}
            {status === 'error' && message}
            {status === 'idle' && (
              <>
                Hi <span className="font-semibold text-foreground">{user?.firstName || user?.username}</span>, 
                we've sent a verification link to <span className="font-semibold text-foreground">{user?.email}</span>.
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {status === 'idle' && (
            <p className="text-muted-foreground">
              Please click the link in the email to verify your account. If you don't see it, check your spam folder.
            </p>
          )}
          {status === 'error' && (
            <p className="text-muted-foreground">
              The link might be expired or invalid. You can request a new one below.
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {status === 'success' ? (
            <Button className="w-full" onClick={() => setLocation("/")}>
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button 
                variant="default" 
                className="w-full" 
                onClick={() => resendVerificationMutation.mutate()}
                disabled={resendVerificationMutation.isPending}
              >
                {resendVerificationMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Resend Verification Email
              </Button>
              
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <Button variant="ghost" className="flex-1" asChild>
                  <Link href="/auth">Back to Login</Link>
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

