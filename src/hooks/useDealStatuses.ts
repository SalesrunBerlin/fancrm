
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DealStatus {
  id: string;
  name: string;
  order_position: number;
  created_at: string;
}

export function useDealStatuses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: dealStatuses, isLoading } = useQuery({
    queryKey: ["dealStatuses"],
    queryFn: async () => {
      const { data: statuses, error } = await supabase
        .from('deal_statuses')
        .select('*')
        .order('order_position');

      if (error) throw error;
      return statuses;
    },
  });

  const createStatus = useMutation({
    mutationFn: async (newStatus: { name: string; order_position: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('deal_statuses')
        .insert([{
          ...newStatus,
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealStatuses"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, ...status }: { id: string; name: string; order_position: number }) => {
      const { error } = await supabase
        .from('deal_statuses')
        .update(status)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealStatuses"] });
    },
  });

  const deleteStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deal_statuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealStatuses"] });
    },
  });

  return {
    dealStatuses,
    isLoading,
    createStatus,
    updateStatus,
    deleteStatus,
  };
}
