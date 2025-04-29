
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  session: null,
  isLoading: true,
  logout: async () => {},
  login: async () => {},
  signup: async () => ({ success: false })
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle auth state changes
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Show appropriate toast messages
        if (event === 'SIGNED_IN' && session?.user) {
          toast.success('Sie wurden erfolgreich angemeldet');
        } else if (event === 'SIGNED_OUT') {
          toast.success('Sie wurden abgemeldet');
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      // Auth state change listener will handle the session update
    } catch (error: any) {
      console.error('Fehler bei der Anmeldung:', error);
      toast.error(error.message || 'Fehler bei der Anmeldung');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Using signUp with data: { email_confirm: true } option to bypass email confirmation
      // for development purposes - remove in production
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This allows auto-confirmation for development purposes
          emailRedirectTo: window.location.origin + '/auth'
        }
      });
      
      if (error) throw error;
      
      const successMessage = "Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.";
      console.log("Signup success:", successMessage, data);
      
      return { success: !!data.user };
    } catch (error: any) {
      console.error('Fehler bei der Registrierung:', error);
      toast.error(error.message || 'Fehler bei der Registrierung');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      // We don't need to update state here as it will be handled by the onAuthStateChange listener
    } catch (error) {
      console.error('Fehler beim Abmelden:', error);
      toast.error('Fehler beim Abmelden');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, logout, login, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth muss innerhalb eines AuthProviders verwendet werden");
  }
  return context;
};
