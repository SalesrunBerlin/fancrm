
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/lib/types/database";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<Account[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User must be logged in to fetch accounts");

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*");

      if (accountsError) throw accountsError;

      // For contacts, we need to count by account_id
      // This is done differently since .group() isn't available
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("account_id");

      if (contactsError) throw contactsError;

      // Count contacts manually
      const countMap = new Map<string, number>();
      contactsData.forEach((contact) => {
        if (contact.account_id) {
          const currentCount = countMap.get(contact.account_id) || 0;
          countMap.set(contact.account_id, currentCount + 1);
        }
      });

      // Transform the database rows to match the Account type
      return accountsData.map((account): Account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        website: account.website,
        industry: account.industry,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        ownerId: account.owner_id,
        contactCount: countMap.get(account.id) || 0,
        tags: account.type ? [account.type] : [] // Use type as a tag for demonstration
      }));
    },
  });
}
