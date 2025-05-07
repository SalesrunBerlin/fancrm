
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
  // Aliases for compatibility
  login: (email: string, password: string) => Promise<{ error: any, success?: boolean }>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, metadata?: any) => Promise<{ error: any, success: boolean }>;
  // Additional properties
  isSuperAdmin: boolean;
  favoriteColor: string;
  setFavoriteColor: (color: string) => void;
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
  // Aliases
  login: async () => ({ error: null }),
  logout: async () => {},
  signup: async () => ({ error: null, success: false }),
  // Additional properties
  isSuperAdmin: false,
  favoriteColor: 'default',
  setFavoriteColor: () => {},
  userRole: undefined,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [favoriteColor, setFavoriteColor] = useState('default');
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if user is a super admin
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsSuperAdmin(false);
        setUserRole(undefined);
      }
      
      setIsLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if user is a super admin
      if (session?.user) {
        checkUserRole(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check user role (super admin, etc)
  const checkUserRole = async (userId: string) => {
    try {
      // For now, let's implement a simple check
      // In a real app, this would check against a roles table in the database
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const role = data?.role || 'user';
      setUserRole(role);
      setIsSuperAdmin(role === 'super_admin' || role === 'admin');

      // Also fetch user's color preference
      const { data: colorData } = await supabase
        .from('profiles')
        .select('favorite_color')
        .eq('id', userId)
        .single();

      if (colorData && colorData.favorite_color) {
        setFavoriteColor(colorData.favorite_color);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsSuperAdmin(false);
      setUserRole('user');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Failed to sign in');
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      toast.error('An unexpected error occurred during sign in');
      return { error: error.message || 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        toast.error(error.message || 'Failed to sign up');
        return { error: error.message, data: null };
      }

      return { error: null, data };
    } catch (error: any) {
      console.error('Unexpected signup error:', error);
      toast.error('An unexpected error occurred during sign up');
      return { error: error.message || 'An unexpected error occurred', data: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (!error) {
        toast.success('Password reset email sent');
      }
      return { error };
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Failed to send password reset email');
      return { error };
    }
  };

  // Aliases for compatibility
  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    return { ...result, success: !result.error };
  };

  const signup = async (email: string, password: string, metadata = {}) => {
    const result = await signUp(email, password, metadata);
    return { ...result, success: !result.error };
  };

  const logout = async () => {
    await signOut();
  };

  const updateFavoriteColor = (color: string) => {
    setFavoriteColor(color);
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    // Aliases
    login,
    logout,
    signup,
    // Additional properties
    isSuperAdmin,
    favoriteColor,
    setFavoriteColor: updateFavoriteColor,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
