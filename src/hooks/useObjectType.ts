
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ObjectType } from "@/hooks/useObjectTypes";

export function useObjectType(objectTypeId: string) {
  const { data: objectType, isLoading, error, refetch } = useQuery({
    queryKey: ["object-type", objectTypeId],
    queryFn: async (): Promise<ObjectType | null> => {
      if (!objectTypeId) return null;
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .eq("id", objectTypeId)
        .single();
      
      if (error) throw error;
      return data as ObjectType;
    },
    enabled: !!objectTypeId,
  });

  return { objectType, isLoading, error, refetch };
}
