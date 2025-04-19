
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DealType } from "@/types";

export function useDeals() {
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async (): Promise<DealType[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          accounts:account_id (
            name
          ),
          contacts:contact_id (
            first_name,
            last_name
          )
        `);

      if (error) throw error;

      return data.map(deal => ({
        id: deal.id,
        name: deal.name,
        amount: Number(deal.amount),
        status: deal.status as DealType['status'],
        accountName: deal.accounts?.name,
        contactName: deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : undefined,
        closeDate: deal.close_date,
        accountId: deal.account_id,
        contactId: deal.contact_id,
      }));
    },
  });

  const createDeal = useMutation({
    mutationFn: async (newDeal: Omit<DealType, 'id' | 'accountName' | 'contactName'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User must be logged in to create a deal");

      const { data, error } = await supabase
        .from('deals')
        .insert([{
          name: newDeal.name,
          amount: newDeal.amount,
          status: newDeal.status,
          account_id: newDeal.accountId,
          contact_id: newDeal.contactId,
          close_date: newDeal.closeDate,
          owner_id: user.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async (deal: DealType) => {
      const { error } = await supabase
        .from('deals')
        .update({
          name: deal.name,
          amount: deal.amount,
          status: deal.status,
          close_date: deal.closeDate,
        })
        .eq('id', deal.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  return {
    deals,
    isLoading,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}
