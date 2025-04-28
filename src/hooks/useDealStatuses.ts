
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DealStatus {
  id: string;
  name: string;
  order_position: number;
  color?: string;
  owner_id: string;
}

export function useDealStatuses() {
  const { user } = useAuth();
  
  const { data: dealStatuses, isLoading, error } = useQuery({
    queryKey: ['deal-statuses'],
    queryFn: async (): Promise<DealStatus[]> => {
      if (!user) {
        return [];
      }

      try {
        // Try to fetch from deal_statuses table (if it exists)
        let { data, error } = await supabase
          .from('deal_statuses')
          .select('*')
          .eq('owner_id', user.id)
          .order('order_position', { ascending: true });

        if (error || !data || data.length === 0) {
          // Fallback to use default statuses as mock data
          return [
            { id: '1', name: 'Prospect', order_position: 1, owner_id: user.id },
            { id: '2', name: 'Qualification', order_position: 2, owner_id: user.id },
            { id: '3', name: 'Proposal', order_position: 3, owner_id: user.id },
            { id: '4', name: 'Negotiation', order_position: 4, owner_id: user.id },
            { id: '5', name: 'Closed Won', order_position: 5, owner_id: user.id },
            { id: '6', name: 'Closed Lost', order_position: 6, owner_id: user.id }
          ];
        }
        
        return data;
      } catch (err) {
        console.error('Error fetching deal statuses:', err);
        // Return default statuses as fallback
        return [
          { id: '1', name: 'Prospect', order_position: 1, owner_id: user.id },
          { id: '2', name: 'Qualification', order_position: 2, owner_id: user.id },
          { id: '3', name: 'Proposal', order_position: 3, owner_id: user.id },
          { id: '4', name: 'Negotiation', order_position: 4, owner_id: user.id },
          { id: '5', name: 'Closed Won', order_position: 5, owner_id: user.id },
          { id: '6', name: 'Closed Lost', order_position: 6, owner_id: user.id }
        ];
      }
    },
    enabled: !!user
  });

  return {
    dealStatuses,
    isLoading,
    error
  };
}
