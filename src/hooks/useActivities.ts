
import { useState } from "react";
import { Activity } from "@/lib/types/database";
import { supabase } from "@/integrations/supabase/client";
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
    
    // Konvertiere von snake_case zu camelCase
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      subject: item.subject,
      description: item.description,
      scheduled_at: item.scheduled_at,
      outcome: item.outcome,
      status: item.status as "open" | "done" | "planned",
      accountId: item.account_id,
      contactId: item.contact_id,
      dealId: item.deal_id,
      owner_id: item.owner_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      // Behalte snake_case Felder für API-Operationen
      account_id: item.account_id,
      contact_id: item.contact_id,
      deal_id: item.deal_id,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) as Activity[];
  };

  const createActivity = async (activityData: Partial<Activity>) => {
    if (!user) return null;
    
    setLoading(true);
    
    try {
      // Konvertiere zu snake_case für die Datenbank
      const dbActivity = {
        type: activityData.type,
        subject: activityData.subject || "",  // Standard-Wert, da required
        description: activityData.description,
        scheduled_at: activityData.scheduled_at,
        outcome: activityData.outcome,
        status: activityData.status || "open",
        account_id: activityData.accountId,
        contact_id: activityData.contactId,
        deal_id: activityData.dealId,
        owner_id: user.id,
      };
      
      const { data, error } = await supabase
        .from("activities")
        .insert(dbActivity)
        .select()
        .single();
        
      if (error) throw error;
      
      // Konvertiere zurück zu camelCase
      const newActivity: Activity = {
        id: data.id,
        type: data.type,
        subject: data.subject,
        description: data.description,
        scheduled_at: data.scheduled_at,
        outcome: data.outcome,
        status: data.status as "open" | "done" | "planned",
        accountId: data.account_id,
        contactId: data.contact_id,
        dealId: data.deal_id,
        owner_id: data.owner_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        // Behalte snake_case Felder
        account_id: data.account_id,
        contact_id: data.contact_id,
        deal_id: data.deal_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      toast.success("Activity created successfully");
      return newActivity;
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
