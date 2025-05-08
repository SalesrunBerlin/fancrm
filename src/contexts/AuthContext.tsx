import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggedIn: boolean; // Add this property
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggedIn: false, // Add this property
  isSuperAdmin: false,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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
      setIsLoading(false);
    });
  }, []);

	useEffect(() => {
		const checkSuperAdmin = async () => {
			if (user) {
				setIsSuperAdmin(user?.app_metadata?.is_super_admin === true);
			} else {
				setIsSuperAdmin(false);
			}
		};

		checkSuperAdmin();
	}, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
		setIsSuperAdmin(false);
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing session:", error);
    } else {
      setUser(data?.session?.user || null);
      setSession(data?.session || null);
      setIsAuthenticated(!!data?.session?.user);
			setIsSuperAdmin(data?.session?.user?.app_metadata?.is_super_admin === true);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAuthenticated, isLoading, isLoggedIn, isSuperAdmin, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
}
