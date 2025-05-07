
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

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
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasDataAccess: boolean;
  hasMetadataAccess: boolean;
  favoriteColor: string;
  setFavoriteColor: (color: string) => void;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string) => Promise<{ success: boolean, error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  isSuperAdmin: false,
  hasDataAccess: false,
  hasMetadataAccess: false,
  favoriteColor: "default",
  setFavoriteColor: () => {},
  signOut: async () => {},
  login: async () => ({ error: null }),
  signup: async () => ({ success: false, error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
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
    setSession(session);
    
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

  // Handle login
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Login failed");
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error("Unexpected login error:", error);
      toast.error(error.message || "An unexpected error occurred");
      return { error };
    }
  };

  // Handle signup
  const signup = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error("Signup error:", error);
        return { success: false, error: error.message };
      }

      // Check if user needs to confirm email
      const needsConfirmation = !data.session;
      if (needsConfirmation) {
        toast.success("Please check your email for confirmation instructions");
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      return { success: false, error: error.message || "Unexpected error during signup" };
    }
  };

  // Handle signout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
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
    session,
    isLoading,
    isAdmin,
    isSuperAdmin,
    hasDataAccess,
    hasMetadataAccess,
    favoriteColor,
    setFavoriteColor: updateFavoriteColor,
    signOut,
    login,
    signup,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
