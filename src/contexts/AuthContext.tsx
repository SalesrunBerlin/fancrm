
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean; // Added missing property
  isLoading: boolean;
  favoriteColor: string | null;
  signOut: () => Promise<void>; // Added missing method
  setFavoriteColor: (color: string | null) => Promise<void>; // Added missing method
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoggedIn: false,
  isSuperAdmin: false,
  isAdmin: false, // Added missing property
  isLoading: true,
  favoriteColor: null,
  signOut: async () => {}, // Added missing method
  setFavoriteColor: async () => {}, // Added missing method
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteColor, setFavoriteColor] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Added missing state

  useEffect(() => {
    const getSession = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user) {
          // Fetch user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('favorite_color, access_level')
            .eq('id', currentSession.user.id)
            .single();
            
          if (!profileError && profile) {
            setFavoriteColor(profile.favorite_color);
            setIsSuperAdmin(profile.access_level === 'admin');
            setIsAdmin(profile.access_level === 'admin' || profile.access_level === 'manager'); // Set isAdmin based on access level
          }
        }
      } catch (error) {
        console.error('Error loading auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Fetch user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('favorite_color, access_level')
            .eq('id', newSession.user.id)
            .single();
            
          if (!profileError && profile) {
            setFavoriteColor(profile.favorite_color);
            setIsSuperAdmin(profile.access_level === 'admin');
            setIsAdmin(profile.access_level === 'admin' || profile.access_level === 'manager'); // Set isAdmin based on access level
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add signOut method
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Add method to update favorite color
  const updateFavoriteColor = async (color: string | null) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_color: color })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setFavoriteColor(color);
    } catch (error) {
      console.error('Error updating favorite color:', error);
    }
  };

  const value = {
    user,
    session,
    isLoggedIn: !!user,
    isLoading,
    isSuperAdmin,
    isAdmin, // Added missing property
    favoriteColor,
    signOut, // Added missing method
    setFavoriteColor: updateFavoriteColor, // Added missing method
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
