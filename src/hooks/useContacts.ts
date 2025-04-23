
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/lib/types/database";
import { useAuth } from "@/contexts/AuthContext";

export function useContacts() {
  const { user, session } = useAuth();
  
  return useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async (): Promise<Contact[]> => {
      if (!user || !session) throw new Error("User must be logged in to fetch contacts");
      
      console.log("Fetching contacts for user:", user.id);
      
      // We're using the Supabase client which automatically includes the auth token
      // Add a filter to only get contacts where owner_id matches the current user's ID
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          accounts:account_id (
            name
          )
        `)
        .eq('owner_id', user.id); // This is the critical change - filter by owner_id

      if (error) {
        console.error("Error fetching contacts:", error);
        throw error;
      }

      console.log("Contacts fetched from database:", data.length);
      
      return data.map(contact => ({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        accountId: contact.account_id,
        accountName: contact.accounts?.name,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
        ownerId: contact.owner_id,
        street: contact.street,
        city: contact.city,
        postal_code: contact.postal_code,
        country: contact.country,
        latitude: contact.latitude,
        longitude: contact.longitude,
      }));
    },
    enabled: !!user && !!session, // Only execute when the user is logged in and has a valid session
  });
}
