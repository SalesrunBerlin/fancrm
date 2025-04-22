
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DealType } from "@/types";

export function useDeals() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async (): Promise<DealType[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User must be logged in to fetch deals");

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
      // Log the status we're trying to update to for debugging
      console.log("Attempting to update deal status to:", deal.status);
      
      // Get the current owner_id from database to ensure we're not changing it
      const { data: existingDeal, error: fetchError } = await supabase
        .from('deals')
        .select('owner_id, status_id')
        .eq('id', deal.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Get the status_id from the deal_statuses table based on the status name
      const { data: statusData, error: statusError } = await supabase
        .from('deal_statuses')
        .select('id')
        .eq('name', deal.status)
        .single();
        
      if (statusError) {
        console.error("Error finding status_id for status:", deal.status, statusError);
        throw new Error(`Status "${deal.status}" not found in deal_statuses table`);
      }
      
      // Now update with the correct fields
      const { error } = await supabase
        .from('deals')
        .update({
          name: deal.name,
          amount: deal.amount,
          status: deal.status,
          status_id: statusData.id, // Set the status_id to link to the deal_statuses table
          close_date: deal.closeDate,
          owner_id: existingDeal.owner_id, // Make sure we keep the original owner
        })
        .eq('id', deal.id);

      if (error) {
        console.error("Error updating deal in Supabase:", error);
        throw error;
      }
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
    data,
    isLoading,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}
