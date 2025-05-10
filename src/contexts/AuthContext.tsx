
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, favorite_color: color }, { onConflict: 'user_id' });
      
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
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user roles:', error);
        return;
      }
      
      // Set admin status based on roles
      setIsSuperAdmin(data?.is_super_admin || false);
      setIsAdmin(data?.is_admin || data?.is_super_admin || false);
    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('favorite_color')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user preferences:', error);
        return;
      }
      
      setFavoriteColorState(data?.favorite_color || null);
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
    setFavoriteColor
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
