
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  favoriteColor: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoggedIn: false,
  isSuperAdmin: false,
  isLoading: true,
  favoriteColor: null,
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
        setUser(newSession?.user || null);
        
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
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoggedIn: !!user,
    isLoading,
    isSuperAdmin,
    favoriteColor,
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
