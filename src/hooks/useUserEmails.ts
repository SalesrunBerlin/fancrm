
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserEmail {
  id: string;
  email: string;
}

export function useUserEmails() {
  const [userEmails, setUserEmails] = useState<UserEmail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSuperAdmin } = useAuth();

  useEffect(() => {
    async function fetchUserEmails() {
      if (!user) {
        console.log("No user logged in, cannot fetch emails");
        setIsLoading(false);
        return;
      }

      if (!isSuperAdmin) {
        console.log("User is not SuperAdmin, cannot fetch emails");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching user emails...");
        
        // Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error("Failed to get current session");
        }
        
        if (!sessionData?.session) {
          console.error("No active session found");
          throw new Error("No active session");
        }

        console.log("Invoking get-user-emails function...");
        const response = await supabase.functions.invoke("get-user-emails", {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (response.error) {
          console.error("Edge Function error:", response.error);
          throw new Error(response.error.message || "Failed to fetch user emails");
        }

        console.log("Emails received:", response.data?.length || 0);
        setUserEmails(response.data || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching user emails:", err);
        setError(err.message || "Failed to fetch user emails");
        toast.error(`Could not load user emails: ${err.message}`);
        
        // Provide fallback data for development
        if (import.meta.env.DEV) {
          console.log("Using fallback email data for development");
          const fallbackEmails = [
            { id: user.id, email: user.email || 'admin@example.com' }
          ];
          setUserEmails(fallbackEmails);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserEmails();
  }, [user, isSuperAdmin]);

  return {
    userEmails,
    isLoading,
    error
  };
}
