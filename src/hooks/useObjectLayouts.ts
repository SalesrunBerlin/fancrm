
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ObjectLayout {
  id: string;
  object_type_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface LayoutCreateInput {
  object_type_id: string;
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface LayoutUpdateInput {
  id: string;
  name?: string;
  description?: string | null;
  is_default?: boolean;
}

export function useObjectLayouts(objectTypeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: layouts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["object-layouts", objectTypeId],
    queryFn: async (): Promise<ObjectLayout[]> => {
      if (!objectTypeId) {
        return [];
      }

      const { data, error } = await supabase
        .from("object_layouts")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .order("is_default", { ascending: false })
        .order("name");

      if (error) {
        console.error("Error fetching object layouts:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!objectTypeId,
  });

  const createLayout = useMutation({
    mutationFn: async (layout: LayoutCreateInput): Promise<ObjectLayout> => {
      if (!user) {
        throw new Error("You must be logged in to create a layout");
      }

      const { data, error } = await supabase
        .from("object_layouts")
        .insert([
          {
            ...layout,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ObjectLayout;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["object-layouts", variables.object_type_id] });
      toast.success("Layout created successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to create layout", {
        description: error.message || "An error occurred while creating the layout."
      });
    },
  });

  const updateLayout = useMutation({
    mutationFn: async (layout: LayoutUpdateInput): Promise<ObjectLayout> => {
      if (!user) {
        throw new Error("You must be logged in to update a layout");
      }

      const { id, ...updateData } = layout;

      const { data, error } = await supabase
        .from("object_layouts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ObjectLayout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-layouts", objectTypeId] });
      toast.success("Layout updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update layout", {
        description: error.message || "An error occurred while updating the layout."
      });
    },
  });

  const deleteLayout = useMutation({
    mutationFn: async (layoutId: string): Promise<void> => {
      if (!user) {
        throw new Error("You must be logged in to delete a layout");
      }

      const { error } = await supabase
        .from("object_layouts")
        .delete()
        .eq("id", layoutId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-layouts", objectTypeId] });
      toast.success("Layout deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete layout", {
        description: error.message || "An error occurred while deleting the layout."
      });
    },
  });

  const getDefaultLayout = () => {
    if (!layouts) return null;
    return layouts.find(layout => layout.is_default) || (layouts.length > 0 ? layouts[0] : null);
  };

  return {
    layouts: layouts || [],
    isLoading,
    error,
    refetch,
    createLayout,
    updateLayout,
    deleteLayout,
    getDefaultLayout
  };
}
