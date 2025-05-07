
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  role?: string;
  avatar_url?: string;
  access_level?: string;
  data_access?: boolean;
  metadata_access?: boolean;
  created_at?: string;
  updated_at?: string;
  favorite_color?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasDataAccess: boolean;
  hasMetadataAccess: boolean;
  favoriteColor: string;
  setFavoriteColor: (color: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isSuperAdmin: false,
  hasDataAccess: false,
  hasMetadataAccess: false,
  favoriteColor: "default",
  setFavoriteColor: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteColor, setFavoriteColor] = useState<string>("default");
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  async function handleSessionChange(session: Session | null) {
    setIsLoading(true);
    
    try {
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          setProfile(profileData);
          
          // Set favorite color from profile
          if (profileData?.favorite_color) {
            setFavoriteColor(profileData.favorite_color);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle signout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Update favorite color in state and database
  const updateFavoriteColor = async (color: string) => {
    setFavoriteColor(color);
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_color: color })
        .eq('id', user.id);
      
      if (error) {
        console.error("Error updating favorite color:", error);
      }
    }
  };

  // Check if user is admin or superadmin
  const isAdmin = profile?.access_level === 'admin' || profile?.access_level === 'superadmin';
  const isSuperAdmin = profile?.access_level === 'superadmin';
  
  // Check access levels
  const hasDataAccess = !!profile?.data_access;
  const hasMetadataAccess = !!profile?.metadata_access;

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAdmin,
    isSuperAdmin,
    hasDataAccess,
    hasMetadataAccess,
    favoriteColor,
    setFavoriteColor: updateFavoriteColor,
    signOut,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
