
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ObjectField {
  id: string;
  object_type_id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
  is_system: boolean;
  default_value?: any;
  options?: {
    target_object_type_id?: string;
    display_field_api_name?: string;
    description?: string;
  };
  display_order: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ObjectType {
  id: string;
  name: string;
  api_name: string;
  description: string | null;
  icon: string | null;
  owner_id: string;
  is_system: boolean;
  is_active: boolean;
  show_in_navigation: boolean;
  default_field_api_name?: string;
  created_at: string;
  updated_at: string;
}

export function useObjectTypes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: objectTypes, isLoading } = useQuery({
    queryKey: ["object-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .or(`is_system.eq.true,owner_id.eq.${user?.id}`)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createObjectType = useMutation({
    mutationFn: async (newObjectType: Omit<ObjectType, "id" | "created_at" | "updated_at" | "owner_id">) => {
      if (!user) throw new Error("User must be logged in to create object types");

      const { data, error } = await supabase
        .from("object_types")
        .insert([{
          ...newObjectType,
          owner_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast({
        title: "Success",
        description: "Object type created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating object type:", error);
      toast({
        title: "Error",
        description: "Failed to create object type",
        variant: "destructive",
      });
    },
  });

  const updateObjectType = useMutation({
    mutationFn: async (updates: Partial<ObjectType> & { id: string }) => {
      const { data, error } = await supabase
        .from("object_types")
        .update(updates)
        .eq("id", updates.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No rows updated");
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
    },
    onError: (error) => {
      console.error("Error updating object type:", error);
    }
  });

  return {
    objectTypes,
    isLoading,
    createObjectType,
    updateObjectType,
  };
}
