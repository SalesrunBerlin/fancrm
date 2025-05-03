
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ActionColor = "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray";

export interface Action {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  action_type: "new_record" | "linked_record";
  target_object_id: string;
  source_field_id: string;
  created_at: string;
  updated_at: string;
  color: ActionColor;
}

export function useActions(objectTypeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get actions for an object type
  const { data: actions, isLoading } = useQuery({
    queryKey: ["actions", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId) return [];
      
      console.log("Fetching actions for objectTypeId:", objectTypeId);
      
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("target_object_id", objectTypeId);
      
      if (error) {
        console.error("Error fetching actions:", error);
        throw error;
      }
      
      console.log("Actions fetched:", data);
      return data as Action[];
    },
    enabled: !!user && !!objectTypeId,
  });

  // Get actions for linked record scenarios
  const { data: linkedActions, isLoading: linkedActionsLoading } = useQuery({
    queryKey: ["linked-actions", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId) return [];
      
      console.log("Fetching linked actions where objectTypeId is source:", objectTypeId);
      
      const { data: sourceFields, error: sourceFieldsError } = await supabase
        .from("object_fields")
        .select("id")
        .eq("object_type_id", objectTypeId)
        .eq("data_type", "lookup");
      
      if (sourceFieldsError) {
        console.error("Error fetching source fields:", sourceFieldsError);
        throw sourceFieldsError;
      }
      
      if (!sourceFields.length) return [];
      
      const sourceFieldIds = sourceFields.map(field => field.id);
      
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("action_type", "linked_record")
        .in("source_field_id", sourceFieldIds);
      
      if (error) {
        console.error("Error fetching linked actions:", error);
        throw error;
      }
      
      console.log("Linked actions fetched:", data);
      return data as Action[];
    },
    enabled: !!user && !!objectTypeId,
  });

  // Get all actions
  const { data: allActions, isLoading: allActionsLoading } = useQuery({
    queryKey: ["all-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions")
        .select("*");
      
      if (error) {
        console.error("Error fetching all actions:", error);
        throw error;
      }
      
      return data as Action[];
    },
    enabled: !!user,
  });

  // Create new action
  const createAction = useMutation({
    mutationFn: async (actionData: Omit<Action, "id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("actions")
        .insert({
          ...actionData,
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["all-actions"] });
      queryClient.invalidateQueries({ queryKey: ["linked-actions"] });
    },
  });

  // Update action
  const updateAction = useMutation({
    mutationFn: async ({ id, ...actionData }: Partial<Action> & { id: string }) => {
      const { data, error } = await supabase
        .from("actions")
        .update(actionData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["all-actions"] });
      queryClient.invalidateQueries({ queryKey: ["linked-actions"] });
    },
  });

  // Delete action
  const deleteAction = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from("actions")
        .delete()
        .eq("id", actionId);
      
      if (error) throw error;
      return actionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["all-actions"] });
      queryClient.invalidateQueries({ queryKey: ["linked-actions"] });
    },
  });

  // Function to get actions by object ID (useful for action buttons in tables)
  const getActionsByObjectId = async (targetObjectId: string): Promise<Action[]> => {
    if (!targetObjectId) return [];
    
    const { data, error } = await supabase
      .from("actions")
      .select("*")
      .eq("target_object_id", targetObjectId);
    
    if (error) {
      console.error("Error fetching actions by object ID:", error);
      throw error;
    }
    
    // Ensure all returned actions have a valid color from ActionColor type
    const validActions = data.map(action => ({
      ...action,
      color: (action.color as ActionColor) || "blue" // Default to blue if color is missing or invalid
    }));
    
    return validActions as Action[];
  };

  return {
    actions,
    linkedActions,
    allActions,
    isLoading: isLoading || linkedActionsLoading || allActionsLoading,
    createAction,
    updateAction,
    deleteAction,
    getActionsByObjectId
  };
}
