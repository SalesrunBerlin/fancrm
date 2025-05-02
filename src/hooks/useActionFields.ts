
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ActionField } from "./useActions";

export interface ActionFieldCreateInput {
  action_id: string;
  field_id: string;
  is_preselected?: boolean;
  default_value?: string | null;
  display_order?: number;
}

export interface ActionFieldWithDetails extends ActionField {
  field_name?: string;
  api_name?: string;
  data_type?: string;
}

export function useActionFields(actionId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Get all fields for an action
  const { data: fields } = useQuery({
    queryKey: ["action-fields", actionId],
    queryFn: async () => {
      if (!user || !actionId) return [];
      
      const { data, error } = await supabase
        .from("action_field_settings")
        .select(`
          *,
          object_fields:field_id (id, name, api_name, data_type, options)
        `)
        .eq("action_id", actionId)
        .order("display_order", { ascending: true });

      if (error) {
        toast.error("Failed to fetch action fields");
        console.error("Error fetching action fields:", error);
        return [];
      }

      return data.map(item => ({
        ...item,
        field_name: item.object_fields?.name,
        api_name: item.object_fields?.api_name,
        data_type: item.object_fields?.data_type,
        options: item.object_fields?.options,
      })) as ActionFieldWithDetails[];
    },
    enabled: !!user && !!actionId,
  });

  // Add a field to an action
  const addField = useMutation({
    mutationFn: async (fieldData: ActionFieldCreateInput) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("action_field_settings")
        .insert(fieldData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ActionField;
    },
    onSuccess: (_data, variables) => {
      toast.success("Field added to action");
      queryClient.invalidateQueries({ queryKey: ["action-fields", variables.action_id] });
    },
    onError: (error) => {
      toast.error("Failed to add field to action");
      console.error("Error adding field:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Update a field in an action
  const updateField = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ActionField> & { id: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { data: updatedData, error } = await supabase
        .from("action_field_settings")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedData as ActionField;
    },
    onSuccess: (_data, variables) => {
      toast.success("Field updated");
      // We need to get the action ID from the database to invalidate the correct query
      if (actionId) {
        queryClient.invalidateQueries({ queryKey: ["action-fields", actionId] });
      }
    },
    onError: (error) => {
      toast.error("Failed to update field");
      console.error("Error updating field:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Remove a field from an action
  const removeField = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { error } = await supabase
        .from("action_field_settings")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Field removed from action");
      if (actionId) {
        queryClient.invalidateQueries({ queryKey: ["action-fields", actionId] });
      }
    },
    onError: (error) => {
      toast.error("Failed to remove field");
      console.error("Error removing field:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Update multiple fields' display order
  const updateFieldsOrder = useMutation({
    mutationFn: async (updates: Array<{ id: string; display_order: number }>) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);

      // Use transaction to update multiple fields
      for (const { id, display_order } of updates) {
        const { error } = await supabase
          .from("action_field_settings")
          .update({ display_order })
          .eq("id", id);

        if (error) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      if (actionId) {
        queryClient.invalidateQueries({ queryKey: ["action-fields", actionId] });
      }
    },
    onError: (error) => {
      toast.error("Failed to update field order");
      console.error("Error updating field order:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  return {
    fields,
    addField,
    updateField,
    removeField,
    updateFieldsOrder,
    isLoading,
  };
}
