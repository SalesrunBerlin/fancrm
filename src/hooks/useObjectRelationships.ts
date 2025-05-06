
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ObjectRelationship {
  id: string;
  from_object_id: string;
  to_object_id: string;
  name: string;
  relationship_type: string;
  created_at: string;
  updated_at: string;
  owner_id?: string;
}

export function useObjectRelationships(objectTypeId?: string) {
  const { user } = useAuth();

  const { data: relationships, isLoading, error } = useQuery({
    queryKey: ["object-relationships", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId || !user) return [];

      const { data, error } = await supabase
        .from("object_relationships")
        .select("*")
        .or(`from_object_id.eq.${objectTypeId},to_object_id.eq.${objectTypeId}`);

      if (error) throw error;
      return data as ObjectRelationship[];
    },
    enabled: !!user && !!objectTypeId,
  });

  return {
    relationships,
    isLoading,
    error,
  };
}
