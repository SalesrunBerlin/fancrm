
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ActionType = 'new_record';

export interface Action {
  id: string;
  name: string;
  description?: string;
  action_type: ActionType;
  target_object_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ActionField {
  id: string;
  action_id: string;
  field_id: string;
  is_preselected: boolean;
  default_value?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActionCreateInput {
  name: string;
  description?: string;
  action_type: ActionType;
  target_object_id: string;
}

export function useActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Get all actions
  const { data: actions, refetch } = useQuery({
    queryKey: ["actions"],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("useActions: Fetching all actions");
      const { data, error } = await supabase
        .from("actions")
        .select("*, object_types(name,api_name)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching actions:", error);
        toast.error("Failed to fetch actions");
        return [];
      }

      console.log(`useActions: Fetched ${data?.length || 0} actions`);
      return data as (Action & { object_types: { name: string; api_name: string } })[];
    },
    enabled: !!user,
  });

  // Get actions by object type ID - using a more reliable approach
  const getActionsByObjectId = async (objectTypeId: string): Promise<Action[]> => {
    if (!user || !objectTypeId) {
      console.log("useActions.getActionsByObjectId: No user or objectTypeId provided");
      return [];
    }
    
    console.log(`useActions: Fetching actions for objectTypeId: ${objectTypeId}`);
    
    try {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("target_object_id", objectTypeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching actions by object ID:", error);
        throw error;
      }

      console.log(`useActions.getActionsByObjectId: Query completed for ${objectTypeId}`);
      
      if (!data || data.length === 0) {
        console.log("useActions.getActionsByObjectId: No data returned from query");
        return [];
      }
      
      console.log(`useActions: Found ${data.length} actions for objectTypeId: ${objectTypeId}`);
      return data as Action[];
    } catch (error) {
      console.error("Exception in getActionsByObjectId:", error);
      throw error; // Re-throw to allow for proper error handling up the call stack
    }
  };

  // Get a single action by ID
  const getAction = async (id: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching action:", error);
        return null;
      }

      return data as Action;
    } catch (error) {
      console.error("Error in getAction:", error);
      return null;
    }
  };

  // Create a new action
  const createAction = useMutation({
    mutationFn: async (actionData: ActionCreateInput) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("actions")
        .insert({
          ...actionData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Action;
    },
    onSuccess: () => {
      toast.success("Action created successfully");
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (error) => {
      toast.error("Failed to create action");
      console.error("Error creating action:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Update an action
  const updateAction = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Action> & { id: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { data: updatedData, error } = await supabase
        .from("actions")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedData as Action;
    },
    onSuccess: () => {
      toast.success("Action updated successfully");
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (error) => {
      toast.error("Failed to update action");
      console.error("Error updating action:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Delete an action
  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { error } = await supabase
        .from("actions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Action deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (error) => {
      toast.error("Failed to delete action");
      console.error("Error deleting action:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  return {
    actions,
    getAction,
    getActionsByObjectId,
    createAction,
    updateAction,
    deleteAction,
    refetch,
    isLoading,
  };
}
