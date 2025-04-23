
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
      
      // Wir verwenden direkt das Supabase-Client, das automatisch das Auth-Token enthält
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          accounts:account_id (
            name
          )
        `);

      if (error) throw error;

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
    enabled: !!user && !!session, // Nur ausführen, wenn der Benutzer eingeloggt ist und eine gültige Session hat
  });
}
