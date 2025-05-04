import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase-client";

interface AuthContextType {
  user: User | null;
//   signInWithGithub: () => void;
  signInWithGoogle: () => void;
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

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };
//   const signInWithGithub = () => {
//     supabase.auth.signInWithOAuth({ provider: "github" });
//   };

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
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}>
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
