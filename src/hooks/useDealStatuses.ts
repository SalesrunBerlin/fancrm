
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DealStatus {
  id: string;
  name: string;
  type?: string;
  order_position: number;
  created_at: string;
}

export function useDealStatuses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: dealStatuses, isLoading } = useQuery({
    queryKey: ["dealStatuses", user?.id],
    queryFn: async () => {
      // Log important information for debugging
      console.log("Fetching deal statuses for user:", user?.id);
      
      if (!user) {
        console.log("No user found, returning empty array");
        return [];
      }

      const { data: statuses, error } = await supabase
        .from('deal_statuses')
        .select('*')
        .eq('owner_id', user.id)
        .order('order_position');

      if (error) {
        console.error("Error fetching deal statuses:", error);
        throw error;
      }
      
      console.log("Fetched deal statuses:", statuses);
      return statuses || [];
    },
    enabled: !!user, // Only fetch if user exists
  });

  const createStatus = useMutation({
    mutationFn: async (newStatus: { name: string; type?: string; order_position: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      console.log("Creating new status:", newStatus);
      
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
    mutationFn: async ({ id, ...status }: { id: string; name: string; type?: string; order_position?: number }) => {
      console.log("Updating status:", id, status);
      
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
      console.log("Deleting status:", id);
      
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

  // Initialize default statuses if there are none
  const initializeDefaultStatuses = async () => {
    if (!user) return;
    
    // Only initialize if there are no statuses yet
    if (dealStatuses && dealStatuses.length === 0) {
      console.log("Initializing default statuses");
      
      try {
        const defaultStatuses = [
          { name: "Prospect", type: "open", order_position: 1 },
          { name: "Qualification", type: "open", order_position: 2 },
          { name: "Proposal", type: "open", order_position: 3 },
          { name: "Negotiation", type: "open", order_position: 4 },
          { name: "Closed Won", type: "won", order_position: 5 },
          { name: "Closed Lost", type: "lost", order_position: 6 }
        ];
        
        // Create default statuses
        for (const status of defaultStatuses) {
          await createStatus.mutateAsync(status);
        }
        
        toast({
          title: "Standard-Status erstellt",
          description: "Die Standard-Deal-Status wurden erfolgreich erstellt."
        });
      } catch (error) {
        console.error("Error initializing default statuses:", error);
        toast({
          title: "Fehler",
          description: "Die Standard-Deal-Status konnten nicht erstellt werden.",
          variant: "destructive"
        });
      }
    }
  };

  return {
    dealStatuses,
    isLoading,
    createStatus,
    updateStatus,
    deleteStatus,
    initializeDefaultStatuses
  };
}
