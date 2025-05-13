
import { useState, useEffect } from "react";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ObjectField } from "@/hooks/useObjectTypes";

export function useEnhancedFields(objectTypeId: string) {
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const [enhancedFields, setEnhancedFields] = useState<ObjectField[]>([]);

  // Fetch all picklist values for this object type in a single query
  const { data: picklistValuesMap, isLoading: isLoadingPicklists } = useQuery({
    queryKey: ["all-picklist-values", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId) return {};
      
      console.log("Fetching all picklist values for object type:", objectTypeId);
      
      const { data, error } = await supabase
        .rpc('get_all_picklist_values', { object_type_id: objectTypeId });
      
      if (error) {
        console.error("Error fetching picklist values:", error);
        throw error;
      }
      
      // Transform into a map keyed by field_id for easier lookup
      const picklistMap: Record<string, any> = {};
      data?.forEach(item => {
        picklistMap[item.field_id] = item.picklist_values;
      });
      
      console.log(`Loaded ${Object.keys(picklistMap).length} picklist value sets in a single query`);
      return picklistMap;
    },
    enabled: !!objectTypeId && !!fields && fields.some(field => field.data_type === 'picklist'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Enhance fields with picklist values when both fields and picklist values are loaded
  useEffect(() => {
    if (!isLoadingFields && fields && picklistValuesMap && !isLoadingPicklists) {
      const picklistFields = fields.filter(field => field.data_type === 'picklist');
      
      if (picklistFields.length === 0) {
        // No picklist fields, just use the original fields
        setEnhancedFields([...fields]);
        return;
      }
      
      // Enhance the fields with their picklist values
      const updatedFields = [...fields].map(field => {
        if (field.data_type === 'picklist' && picklistValuesMap[field.id]) {
          return {
            ...field,
            options: picklistValuesMap[field.id]
          };
        }
        return field;
      });
      
      setEnhancedFields(updatedFields);
    } else if (!isLoadingFields && fields && fields.every(field => field.data_type !== 'picklist')) {
      // If there are no picklist fields, no need to wait for picklist values
      setEnhancedFields([...fields]);
    }
  }, [fields, isLoadingFields, picklistValuesMap, isLoadingPicklists]);

  return {
    fields: enhancedFields.length > 0 ? enhancedFields : fields,
    isLoading: isLoadingFields || (fields?.some(field => field.data_type === 'picklist') && isLoadingPicklists)
  };
}
