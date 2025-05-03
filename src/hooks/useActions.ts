import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ActionColor = 
  | 'blue' 
  | 'green' 
  | 'red' 
  | 'yellow' 
  | 'purple' 
  | 'pink' 
  | 'indigo' 
  | 'orange' 
  | 'gray';

export interface Action {
  id: string;
  name: string;
  description: string;
  action_type: 'new_record' | 'linked_record' | 'mass_action';
  color: ActionColor;
  source_field_id?: string | null;
  target_object_id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  lookup_field_id?: string | null;
}

export interface ActionInput {
  name: string;
  description: string;
  action_type: 'new_record' | 'linked_record' | 'mass_action';
  color: ActionColor;
  source_field_id?: string | null;
  target_object_id: string;
  lookup_field_id?: string | null;
}

export function useActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all actions
  const {
    data: actions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("owner_id", user?.id);

      if (error) {
        throw error;
      }

      return data as Action[];
    },
    enabled: !!user,
  });

  // Get a single action by ID
  const {
    data: action,
    isLoading: isActionLoading,
    error: actionError,
  } = useQuery({
    queryKey: ["actions"],
    queryFn: async (actionId: string) => {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("id", actionId)
        .eq("owner_id", user?.id)
        .single();

      if (error) {
        throw error;
      }

      return data as Action;
    },
    enabled: !!user,
  });

  // Get actions by object ID
  const getActionsByObjectId = async (objectTypeId: string): Promise<Action[]> => {
    try {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("target_object_id", objectTypeId)
        .eq("owner_id", user?.id);

      if (error) {
        console.error("Error fetching actions by object ID:", error);
        throw error;
      }

      return data as Action[];
    } catch (error) {
      console.error("Error in getActionsByObjectId:", error);
      throw error;
    }
  };

  // Create a new action
  const createAction = useMutation({
    mutationFn: async (action: ActionInput) => {
      if (!user) {
        throw new Error("You must be logged in to create an action");
      }

      const { data, error } = await supabase
        .from("actions")
        .insert([
          {
            ...action,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Action;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Action created successfully", {
        description: "Your new action has been created."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to create action", {
        description: error.message || "An error occurred while creating the action."
      });
    },
  });

  // Update an action
  const updateAction = useMutation({
    mutationFn: async (action: Partial<Action> & { id: string }) => {
      if (!user) {
        throw new Error("You must be logged in to update an action");
      }

      const { id, ...updates } = action;

      const { data, error } = await supabase
        .from("actions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Action;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Action updated successfully", {
        description: "The action has been updated."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to update action", {
        description: error.message || "An error occurred while updating the action."
      });
    },
  });

  // Delete an action
  const deleteAction = useMutation({
    mutationFn: async (actionId: string) => {
      if (!user) {
        throw new Error("You must be logged in to delete an action");
      }

      const { error } = await supabase
        .from("actions")
        .delete()
        .eq("id", actionId);

      if (error) {
        throw error;
      }

      return actionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Action deleted successfully", {
        description: "The action has been deleted."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to delete action", {
        description: error.message || "An error occurred while deleting the action."
      });
    },
  });

  return {
    actions,
    action,
    isLoading,
    isActionLoading,
    error,
    actionError,
    getActionsByObjectId,
    createAction,
    updateAction,
    deleteAction,
  };
}
