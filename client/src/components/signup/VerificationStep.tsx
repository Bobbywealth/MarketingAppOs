import { motion } from "framer-motion";
import { Mail, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VerificationStepProps {
  email: string;
  onVerified: () => void;
}

export function VerificationStep({ email, onVerified }: VerificationStepProps) {
  const { user, userMutation } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Poll for verification status every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiRequest("GET", "/api/user", undefined);
        const currentUser = await response.json();
        if (currentUser?.emailVerified) {
          onVerified();
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onVerified]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await apiRequest("POST", "/api/auth/resend-verification", undefined);
      toast({
        title: "✅ Verification email resent",
        description: "Please check your inbox (and spam folder).",
      });
    } catch (error: any) {
      toast({
        title: "❌ Failed to resend",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await apiRequest("GET", "/api/user", undefined);
      const currentUser = await response.json();
      if (currentUser?.emailVerified) {
        onVerified();
      } else {
        toast({
          title: "Still pending",
          description: "We haven't detected your verification yet. Please click the link in your email.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not check status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8 py-8"
    >
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto shadow-inner">
        <Mail className="w-10 h-10" />
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-black text-slate-900">Verify Your Email</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          We've sent a verification link to <span className="font-bold text-slate-900">{email}</span>.
          Please click the link in your email to continue.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-xs mx-auto">
        <Button
          onClick={checkStatus}
          disabled={isChecking}
          className="h-14 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
        >
          {isChecking ? (
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <ArrowRight className="w-5 h-5 mr-2" />
          )}
          I've Verified My Email
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={isResending}
          className="text-slate-500 font-bold hover:text-blue-600"
        >
          {isResending ? "Resending..." : "Resend Verification Email"}
        </Button>
      </div>

      <div className="pt-8 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
          Step 3: Account Verification (GATE)
        </p>
      </div>
    </motion.div>
  );
}

