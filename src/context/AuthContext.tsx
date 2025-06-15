import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase-client";

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  signUpWithEmail: (email: string, password: string, role?: string) => Promise<AuthResponse>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error("Error checking user session:", error);
      setUser(null);
    }
  };

  const signUpWithEmail = async (email: string, password: string, role: string = "user"): Promise<AuthResponse> => {
    try {
      // Step 1: Sign up
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email,
            full_name: email.split('@')[0],
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Step 2: Sign in (to get a session)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return { success: false, error: signInError.message };
      }

      // Step 3: Insert profile (now authenticated)
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            user_id: signInData.user.id,
            role: role
          }
        ])
        .select()
        .single();

      if (profileError) {
        return { success: false, error: "Failed to create user profile. Please try signing in, or contact support if the issue persists." };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting to sign in...');
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('Sign in successful');
      return {
        success: true
      };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign in",
      };
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth data first
      setUser(null);
      
      // Clear all localStorage data
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      }
      
      // Kill the session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Navigate to landing page
      window.location.href = '/';
      
    } catch (error) {
      console.error("Error during sign out:", error);
      // Force a hard refresh even on error
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, signUpWithEmail, signInWithEmail, signOut }}>
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
