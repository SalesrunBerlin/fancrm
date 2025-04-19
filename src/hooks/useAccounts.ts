
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/lib/types/database";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<Account[]> => {
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*");

      if (accountsError) throw accountsError;

      // Get contact counts for each account
      const { data: contactCounts, error: contactsError } = await supabase
        .from("contacts")
        .select("account_id, count")
        .not("account_id", "is", null)
        .group_by("account_id");

      if (contactsError) throw contactsError;

      const countMap = new Map(
        contactCounts.map(({ account_id, count }) => [account_id, count])
      );

      return accountsData.map(account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        website: account.website,
        industry: account.industry,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        ownerId: account.owner_id,
        contactCount: Number(countMap.get(account.id) || 0),
      }));
    },
  });
}
