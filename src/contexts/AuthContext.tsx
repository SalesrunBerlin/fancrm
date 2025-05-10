
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserPreferences {
  favorite_color: string | null;
}

interface UserRoles {
  is_super_admin: boolean;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: any; data: any }>;
  signUp: (credentials: { email: string; password: string }) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  favoriteColor: string | null;
  setFavoriteColor: (color: string) => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [favoriteColor, setFavoriteColorState] = useState<string | null>(null);

  // Fixed setFavoriteColor function with proper error handling
  const setFavoriteColor = async (color: string): Promise<void> => {
    try {
      if (!user) return;
      
      // Create a user_preferences table entry using RPC
      const { error } = await supabase.rpc('set_user_color_preference', {
        user_id_param: user.id,
        color_param: color
      });
      
      if (error) throw error;
      
      // Update the local state after successful DB update
      setFavoriteColorState(color);
    } catch (error) {
      console.error("Error saving color preference:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // When auth state changes, check for user roles
        if (session?.user) {
          checkUserRoles(session.user.id);
          loadUserPreferences(session.user.id);
        } else {
          setIsSuperAdmin(false);
          setIsAdmin(false);
          setFavoriteColorState(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check for roles on initial load
      if (session?.user) {
        checkUserRoles(session.user.id);
        loadUserPreferences(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRoles = async (userId: string) => {
    try {
      // Use RPC to check user roles
      const { data, error } = await supabase.rpc('get_user_roles', {
        user_id_param: userId
      });
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }
      
      // Set admin status based on roles
      if (data) {
        setIsSuperAdmin(data.is_super_admin || false);
        setIsAdmin(data.is_admin || data.is_super_admin || false);
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      // Use RPC to get user preferences
      const { data, error } = await supabase.rpc('get_user_preferences', {
        user_id_param: userId
      });
      
      if (error) {
        console.error('Error loading user preferences:', error);
        return;
      }
      
      if (data) {
        setFavoriteColorState(data.favorite_color || null);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    return await supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSuperAdmin(false);
    setIsAdmin(false);
  };

  const isLoggedIn = !!user;

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    isSuperAdmin,
    isAdmin,
    favoriteColor,
    setFavoriteColor,
    isLoggedIn
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

// Add boolean check for login status
export const useIsLoggedIn = () => {
  const { user, isLoading } = useAuth();
  return { isLoggedIn: !!user, isLoading };
};
