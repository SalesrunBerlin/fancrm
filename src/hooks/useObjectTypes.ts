
/**
 * This is a patch to fix TypeScript errors related to ObjectTypes and ObjectField interfaces
 * 
 * If you can directly edit this file, add the missing properties (source_object_id, owner_id)
 * to fix TypeScript errors in dependent files
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ObjectType {
  id: string;
  name: string;
  api_name: string;
  description?: string;
  icon?: string;
  is_system?: boolean;
  is_active?: boolean;
  show_in_navigation?: boolean;
  is_published?: boolean;
  is_template?: boolean;
  source_object_id?: string; // Added to fix TypeScript errors
  owner_id?: string; // Added to fix TypeScript errors
  default_field_api_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ObjectField {
  id: string;
  object_type_id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required?: boolean;
  is_system?: boolean;
  default_value?: string | null;
  options?: any;
  display_order?: number;
  owner_id?: string; // Added to fix TypeScript errors
}

export function useObjectTypes() {
  const { data: objectTypes, isLoading, error, refetch } = useQuery({
    queryKey: ["object-types"],
    queryFn: async () => {
      // This is a simplified version - implement your actual query logic here
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as ObjectType[];
    }
  });

  return {
    objectTypes,
    isLoading,
    error,
    refetch
  };
}
