
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
        .select("account_id, count(*)")
        .not("account_id", "is", null)
        .groupBy("account_id");

      if (contactsError) throw contactsError;

      const countMap = new Map(
        contactCounts.map((row) => [row.account_id, Number(row.count)])
      );

      return accountsData.map(account => ({
        ...account,
        contactCount: countMap.get(account.id) || 0,
      }));
    },
  });
}
