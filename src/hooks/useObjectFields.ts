
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { ObjectField } from "./useObjectTypes";

export function useObjectFields(objectTypeId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fields, isLoading } = useQuery({
    queryKey: ["object-fields", objectTypeId],
    queryFn: async (): Promise<ObjectField[]> => {
      const { data, error } = await supabase
        .from("object_fields")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .order("display_order");

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!objectTypeId,
  });

  const createField = useMutation({
    mutationFn: async (newField: Omit<ObjectField, "id" | "created_at" | "updated_at" | "owner_id">) => {
      if (!user) throw new Error("User must be logged in to create fields");

      const { data, error } = await supabase
        .from("object_fields")
        .insert([{
          ...newField,
          owner_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      toast({
        title: "Success",
        description: "Field created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating field:", error);
      toast({
        title: "Error",
        description: "Failed to create field",
        variant: "destructive",
      });
    },
  });

  return {
    fields,
    isLoading,
    createField,
  };
}
