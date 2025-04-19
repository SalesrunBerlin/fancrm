
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/lib/types/database";

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async (): Promise<Contact[]> => {
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
      }));
    },
  });
}
