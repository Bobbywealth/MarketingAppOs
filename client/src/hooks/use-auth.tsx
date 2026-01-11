import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { insertUserSchema } from "@shared/validation";
import { InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// OneSignal removed - using Native Web Push

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  resendVerificationMutation: UseMutationResult<any, Error, void>;
  switchRoleMutation: UseMutationResult<SelectUser, Error, void>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // OneSignal removed - using Native Web Push

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'login-pre',hypothesisId:'D',location:'client/src/hooks/use-auth.tsx:loginMutation',message:'Login mutation start',data:{username:credentials?.username?.slice?.(0,80),origin:window.location.origin,viteApiBaseUrl:(import.meta as any)?.env?.VITE_API_BASE_URL||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'login-pre',hypothesisId:'D',location:'client/src/hooks/use-auth.tsx:loginMutation',message:'Login mutation response ok',data:{status:res.status},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return await res.json();
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'login-pre',hypothesisId:'D',location:'client/src/hooks/use-auth.tsx:loginMutation',message:'Login mutation error',data:{error:String((e as any)?.message||e)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        throw e;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-verification");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification email sent",
        description: data.message || "Please check your inbox.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend verification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      // OneSignal removed - using Native Web Push
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const switchRoleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/switch-role");
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Also refresh permissions and any role-gated data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Switched view",
        description: `You're now in ${user.role} mode.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not switch view",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        resendVerificationMutation,
        switchRoleMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
