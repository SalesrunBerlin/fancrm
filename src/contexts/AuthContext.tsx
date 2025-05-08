
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  isAdmin?: boolean;
  favoriteColor?: string;
  setFavoriteColor?: (color: string) => Promise<void>;
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: AuthError | null; data: any }>;
  signUp: (credentials: { email: string; password: string }) => Promise<{ error: AuthError | null; data: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggedIn: false,
  isSuperAdmin: false,
  isAdmin: false,
  favoriteColor: 'default',
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [favoriteColor, setFavoriteColorState] = useState<string>('default');
  const isLoggedIn = !!user;

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setUser(session?.user || null);
      setSession(session || null);
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    };

    loadSession();

    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setSession(session || null);
      setIsAuthenticated(!!session?.user);
      setIsSuperAdmin(session?.user?.app_metadata?.is_super_admin === true);
      setIsAdmin(session?.user?.app_metadata?.is_admin === true || session?.user?.app_metadata?.is_super_admin === true);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (user) {
        setIsSuperAdmin(user?.app_metadata?.is_super_admin === true);
        setIsAdmin(user?.app_metadata?.is_admin === true || user?.app_metadata?.is_super_admin === true);
      } else {
        setIsSuperAdmin(false);
        setIsAdmin(false);
      }
    };

    checkSuperAdmin();
  }, [user]);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Login failed: ${error.message}`);
        return { error, data };
      }

      return { error: null, data };
    } catch (error) {
      console.error("Error in signIn:", error);
      return { error: error as AuthError, data: null };
    }
  };

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(`Registration failed: ${error.message}`);
        return { error, data };
      }
      
      toast.success("Registration successful! Please check your email for verification.");
      return { error: null, data };
    } catch (error) {
      console.error("Error in signUp:", error);
      return { error: error as AuthError, data: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
    setIsAdmin(false);
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Error refreshing session:", error);
    } else {
      setUser(data?.session?.user || null);
      setSession(data?.session || null);
      setIsAuthenticated(!!data?.session?.user);
      setIsSuperAdmin(data?.session?.user?.app_metadata?.is_super_admin === true);
      setIsAdmin(data?.session?.user?.app_metadata?.is_admin === true || data?.session?.user?.app_metadata?.is_super_admin === true);
    }
  };

  const setFavoriteColor = async (color: string) => {
    setFavoriteColorState(color);
    // Here you would typically save this to a database or local storage
    // For now, we're just updating the state
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAuthenticated, 
      isLoading, 
      isLoggedIn, 
      isSuperAdmin, 
      isAdmin,
      favoriteColor, 
      setFavoriteColor,
      signIn,
      signUp,
      signOut, 
      refreshSession 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
