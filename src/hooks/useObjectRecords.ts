import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ObjectRecord {
  id: string;
  record_id: string;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_modified_by: string;
  owner_id: string;
}

export function useObjectRecords(objectTypeId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async (): Promise<ObjectRecord[]> => {
      const { data, error } = await supabase
        .from("object_records")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!objectTypeId,
  });

  const createRecord = useMutation({
    mutationFn: async (newRecord: Partial<ObjectRecord>) => {
      if (!objectTypeId) throw new Error("Object type ID is required");
      
      const { data, error } = await supabase
        .from("object_records")
        .insert({
          object_type_id: objectTypeId,
          owner_id: user?.id,
          ...newRecord
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast({
        title: "Success",
        description: "Record created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating record:", error);
      toast({
        title: "Error",
        description: "Failed to create record",
        variant: "destructive",
      });
    },
  });

  return {
    records,
    isLoading,
    createRecord,
  };
}
