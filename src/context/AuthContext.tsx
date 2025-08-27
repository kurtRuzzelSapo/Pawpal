import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase-client";

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  signUpWithEmail: (
    email: string,
    password: string,
    role?: string
  ) => Promise<AuthResponse>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // <-- Add this line!
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("users") // or 'profiles' if that's your table
      .select("role")
      .eq("user_id", userId)
      .single();
    if (!error && data) {
      setRole(data.role);
      localStorage.setItem("userRole", data.role);
    } else {
      setRole(null);
      localStorage.removeItem("userRole");
    }
  };

  useEffect(() => {
    checkUser();
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) setRole(savedRole);
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRole(user.id);
    } else {
      setRole(null);
      localStorage.removeItem("userRole");
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error("Error checking user session:", error);
      setUser(null);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    role: string = "user"
  ): Promise<AuthResponse> => {
    try {
      // Step 1: Sign up
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email,
            full_name: email.split("@")[0],
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Step 2: Sign in (to get a session)
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        return { success: false, error: signInError.message };
      }

      // Step 3: Insert profile (now authenticated)
      const { error: profileError } = await supabase
        .from("users")
        .insert([
          {
            user_id: signInData.user.id,
            role: role,
          },
        ])
        .select()
        .single();

      if (profileError) {
        return {
          success: false,
          error:
            "Failed to create user profile. Please try signing in, or contact support if the issue persists.",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      console.log("Attempting to sign in...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      if (!data?.user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Get user role from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user role:", userError);
        return {
          success: false,
          error: "Error fetching user role",
        };
      }

      // Store role in localStorage
      localStorage.setItem("userRole", userData.role || "user");

      console.log("Sign in successful");
      return {
        success: true,
      };
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth data first
      setUser(null);
      setRole(null);

      // Clear all localStorage data
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("supabase.auth.")) {
          localStorage.removeItem(key);
        }
      }
      // Also clear your custom role key
      localStorage.removeItem("userRole");

      // Kill the session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Navigate to landing page
      window.location.href = "/";
    } catch (error) {
      console.error("Error during sign out:", error);
      // Force a hard refresh even on error
      window.location.href = "/";
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        signInWithGoogle, // <-- Add this line!
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within the AuthProvider");
  }
  return context;
};
