
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/lib/types/database";

/**
 * Lädt begleitende Account- und Owner-Informationen zu einem Kontakt
 */
export function useFetchContactRelations(contactId?: string) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase.from("accounts").select("id, name");
      if (!error) setAccounts(data || []);
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          accounts:account_id ( name ),
          profiles:owner_id ( first_name, last_name )
        `)
        .eq("id", contactId)
        .single();

      if (!error && data) {
        const result: Contact = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          accountId: data.account_id,
          accountName: data.accounts?.name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          ownerId: data.owner_id,
          street: data.street,
          city: data.city,
          postal_code: data.postal_code,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
        };
        setContact(result);

        if (data.profiles) {
          setOwnerName(
            `${data.profiles.first_name ?? ""} ${data.profiles.last_name ?? ""}`.trim()
          );
        }
      }
      setIsLoading(false);
    };

    fetchContact();
  }, [contactId]);

  return { contact, setContact, ownerName, accounts, isLoading };
}
