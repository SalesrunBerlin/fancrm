
import { useState } from "react";
import { Activity } from "@/lib/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useActivities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const fetchActivities = async (filterBy?: { type: 'contact' | 'account' | 'deal'; id: string }) => {
    if (!user) return [];
    
    let query = supabase
      .from("activities")
      .select("*")
      .eq("owner_id", user.id);

    if (filterBy) {
      if (filterBy.type === 'contact') {
        query = query.eq('contact_id', filterBy.id);
      } else if (filterBy.type === 'account') {
        query = query.eq('account_id', filterBy.id);
      } else if (filterBy.type === 'deal') {
        query = query.eq('deal_id', filterBy.id);
      }
    }
    
    const { data, error } = await query.order('scheduled_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching activities:", error);
      throw error;
    }
    
    return (data || []) as Activity[];
  };

  const createActivity = async (activityData: Partial<Activity>) => {
    if (!user) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          ...activityData,
          owner_id: user.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      toast.success("Activity created successfully");
      return data as Activity;
    } catch (error: any) {
      console.error("Error creating activity:", error);
      toast.error("Error creating activity", {
        description: error.message
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);
        
      if (error) throw error;
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      toast.success("Activity deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting activity:", error);
      toast.error("Error deleting activity", {
        description: error.message
      });
      return false;
    }
  };

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => fetchActivities(),
    enabled: !!user
  });

  return {
    activities,
    loading: isLoading || loading,
    createActivity,
    deleteActivity,
    fetchActivities
  };
}
