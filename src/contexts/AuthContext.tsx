
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  isSuperAdmin?: boolean;
  favoriteColor?: string;
  setFavoriteColor?: (color: string) => void;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean, error: string | null }>;
  signup: (email: string, password: string) => Promise<{ success: boolean, error: string | null }>;
  userRole?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  logout: async () => {},
  login: async () => ({ success: false, error: null }),
  signup: async () => ({ success: false, error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [favoriteColor, setFavoriteColor] = useState<string>('blue');
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Check if the user is a super admin
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsSuperAdmin(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Check if the user is a super admin
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to check if user is a super admin
  const checkUserRole = async (userId: string) => {
    try {
      // This is just a placeholder - in a real app, you would check the user's role in your database
      // For now, we'll just set isSuperAdmin to true for demonstration
      setIsSuperAdmin(true);
      setUserRole('admin');
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsSuperAdmin(false);
      setUserRole('user');
    }
  };

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email);
  };

  // Add login, logout, and signup functions with better error handling
  const login = async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (error: any) {
      toast.error(error.message || "Anmeldung fehlgeschlagen");
      return { success: false, error: error.message || "Anmeldung fehlgeschlagen" };
    }
  };

  const logout = async () => {
    await signOut();
    toast.info("Sie wurden erfolgreich abgemeldet");
  };

  const signup = async (email: string, password: string) => {
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }
      
      toast.success("Registrierung erfolgreich");
      return { success: true, error: null };
    } catch (error: any) {
      toast.error(error.message || "Registrierung fehlgeschlagen");
      return { success: false, error: error.message || "Registrierung fehlgeschlagen" };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isSuperAdmin,
    favoriteColor,
    setFavoriteColor,
    logout,
    login,
    signup,
    userRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
