
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
      if (!user || !isSuperAdmin) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session) {
          throw new Error("No active session");
        }

        const response = await supabase.functions.invoke("get-user-emails", {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Failed to fetch user emails");
        }

        setUserEmails(response.data.data || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching user emails:", err);
        setError(err.message || "Failed to fetch user emails");
        toast.error("Could not load user emails");
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
