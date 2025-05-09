import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ObjectField } from "@/hooks/useObjectTypes";

export interface LayoutField {
  id: string;
  layout_id: string;
  field_id: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  field?: ObjectField; // Joined field data
}

export interface LayoutFieldInput {
  layout_id: string;
  field_id: string;
  display_order: number;
  is_visible: boolean;
}

export interface LayoutFieldUpdate {
  id: string;
  display_order?: number;
  is_visible?: boolean;
}

export function useLayoutFields(layoutId?: string, includeFields: boolean = false) {
  const queryClient = useQueryClient();

  const {
    data: layoutFields,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["layout-fields", layoutId],
    queryFn: async (): Promise<LayoutField[]> => {
      if (!layoutId) {
        return [];
      }

      // Use separate queries based on whether we need to include field data
      if (includeFields) {
        // First fetch layout fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("layout_fields")
          .select("*")
          .eq("layout_id", layoutId)
          .order("display_order");

        if (fieldsError) {
          console.error("Error fetching layout fields:", fieldsError);
          throw fieldsError;
        }

        // Then fetch related field data for each layout field
        const fieldsWithData = await Promise.all(
          (fieldsData || []).map(async (layoutField) => {
            const { data: fieldData, error: fieldError } = await supabase
              .from("object_fields")
              .select("*")
              .eq("id", layoutField.field_id)
              .single();

            if (fieldError) {
              console.error("Error fetching field data:", fieldError);
              return {
                ...layoutField,
                field: null
              } as LayoutField;
            }

            return {
              ...layoutField,
              field: fieldData as ObjectField
            } as LayoutField;
          })
        );

        return fieldsWithData;
      } else {
        // Simple query without joining field data
        const { data, error } = await supabase
          .from("layout_fields")
          .select("*")
          .eq("layout_id", layoutId)
          .order("display_order");

        if (error) {
          console.error("Error fetching layout fields:", error);
          throw error;
        }

        return data || [];
      }
    },
    enabled: !!layoutId,
  });

  const createLayoutField = useMutation({
    mutationFn: async (field: LayoutFieldInput): Promise<LayoutField> => {
      const { data, error } = await supabase
        .from("layout_fields")
        .insert([field])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LayoutField;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["layout-fields", variables.layout_id] });
      toast.success("Field added to layout successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to add field to layout", {
        description: error.message || "An error occurred."
      });
    },
  });

  const updateLayoutField = useMutation({
    mutationFn: async (field: LayoutFieldUpdate): Promise<LayoutField> => {
      const { id, ...updateData } = field;

      const { data, error } = await supabase
        .from("layout_fields")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LayoutField;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layout-fields", layoutId] });
    },
    onError: (error: any) => {
      toast.error("Failed to update field layout", {
        description: error.message || "An error occurred."
      });
    },
  });

  const deleteLayoutField = useMutation({
    mutationFn: async (fieldId: string): Promise<void> => {
      const { error } = await supabase
        .from("layout_fields")
        .delete()
        .eq("id", fieldId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layout-fields", layoutId] });
      toast.success("Field removed from layout successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to remove field from layout", {
        description: error.message || "An error occurred."
      });
    },
  });

  const updateMultipleFieldOrders = useMutation({
    mutationFn: async (updates: { id: string, display_order: number }[]): Promise<void> => {
      // Use individual updates for efficient batching
      for (const update of updates) {
        const { error } = await supabase
          .from("layout_fields")
          .update({ display_order: update.display_order })
          .eq("id", update.id);

        if (error) {
          console.error("Error updating field order:", error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layout-fields", layoutId] });
      toast.success("Field order updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update field order", {
        description: error.message || "An error occurred."
      });
    },
  });

  // Initialize layout with all fields for an object type
  const initializeLayoutFields = useMutation({
    mutationFn: async ({ layoutId, objectTypeId, fields }: { 
      layoutId: string, 
      objectTypeId: string,
      fields: ObjectField[]
    }): Promise<void> => {
      if (!layoutId || !objectTypeId || !fields.length) {
        throw new Error("Missing required parameters");
      }

      // Prepare batch insert data
      const layoutFields = fields.map((field, index) => ({
        layout_id: layoutId,
        field_id: field.id,
        display_order: field.display_order || index + 1,
        is_visible: true
      }));

      const { error } = await supabase
        .from("layout_fields")
        .insert(layoutFields);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layout-fields", layoutId] });
      toast.success("Layout initialized with fields");
    },
    onError: (error: any) => {
      toast.error("Failed to initialize layout", {
        description: error.message || "An error occurred."
      });
    },
  });

  return {
    layoutFields: layoutFields || [],
    isLoading,
    error,
    refetch,
    createLayoutField,
    updateLayoutField,
    deleteLayoutField,
    updateMultipleFieldOrders,
    initializeLayoutFields
  };
}
