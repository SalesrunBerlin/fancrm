
// We won't modify this file directly as it's in the read-only files list.
// Instead we'll create a patch to extend the AuthContext type
import { User, Session } from '@supabase/supabase-js';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
}

// Extend the AuthContextType with isSuperAdmin and isAdmin
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<{ error: any }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  updateUser: (data: any) => Promise<{ error: any; data: any }>;
  userRole?: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Fetch initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              fetchUserRole(session.user.id);
            } else {
              setUserRole(undefined);
            }
          }
        );

        return () => subscription.unsubscribe();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }
      
      setUserRole(data?.role);
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
  };

  const signIn = async ({ email, password }: SignInCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error, data };
  };

  const signUp = async ({ email, password }: SignUpCredentials) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const updateUser = async (data: any) => {
    const { data: userData, error } = await supabase.auth.updateUser(data);
    return { error, data: userData };
  };

  // Check if user is SuperAdmin or Admin
  const isSuperAdmin = userRole === 'SuperAdmin' || userRole === 'superadmin';
  const isAdmin = isSuperAdmin || userRole === 'admin';

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateUser,
    userRole,
    isSuperAdmin,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
