
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ObjectRecord {
  id: string;
  record_id: string | null;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  created_by: string | null;
  last_modified_by: string | null;
}

export function useObjectRecords(objectTypeId: string) {
  const { user } = useAuth();

  const {
    data: records,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async (): Promise<ObjectRecord[]> => {
      if (!objectTypeId || !user) {
        return [];
      }
      
      console.log(`Fetching records for object type: ${objectTypeId}`);
      
      const { data, error } = await supabase
        .from("object_records")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .limit(100);
      
      if (error) {
        console.error("Error fetching records:", error);
        throw error;
      }
      
      console.log(`Fetched ${data.length} records`);
      return data;
    },
    enabled: !!objectTypeId && !!user,
  });

  return {
    records,
    isLoading,
    error,
    refetch,
  };
}
