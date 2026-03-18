import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { insertUserSchema } from "@shared/validation";
import { InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { getSafeErrorMessage } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { clientDebug } from "../lib/debug";
// OneSignal removed - using Native Web Push

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: unknown;
  loginMutation: UseMutationResult<SelectUser, unknown, LoginData>;
  logoutMutation: UseMutationResult<void, unknown, void>;
  registerMutation: UseMutationResult<SelectUser, unknown, InsertUser>;
  switchRoleMutation: UseMutationResult<SelectUser, unknown, void>;
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
  } = useQuery<SelectUser | undefined, unknown>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Log auth state changes for debugging random logout issue
  clientDebug.authStateChange(user?.id, isLoading);

  // OneSignal removed - using Native Web Push

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      clientDebug.loginStart(credentials.username);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        const userData = await res.json();
        clientDebug.loginSuccess(userData.id);
        return userData;
      } catch (error: unknown) {
        clientDebug.loginError(getSafeErrorMessage(error, "Login request failed."));
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Login failed",
        description: getSafeErrorMessage(error, "Login failed. Please try again."),
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
    onError: (error: unknown) => {
      toast({
        title: "Registration failed",
        description: getSafeErrorMessage(error, "Registration failed. Please try again."),
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clientDebug.logoutStart(user?.id);
      await apiRequest("POST", "/api/logout");
      clientDebug.logoutSuccess();
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
    onError: (error: unknown) => {
      toast({
        title: "Logout failed",
        description: getSafeErrorMessage(error, "Logout failed. Please try again."),
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
    onError: (error: unknown) => {
      toast({
        title: "Could not switch view",
        description: getSafeErrorMessage(error, "Could not switch view. Please try again."),
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
