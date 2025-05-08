
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LookupValueDisplayProps {
  value: string;
  fieldOptions: {
    target_object_type_id: string;
    display_field_api_name?: string;
  };
}

export function LookupValueDisplay({ value, fieldOptions }: LookupValueDisplayProps) {
  const [displayValue, setDisplayValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { target_object_type_id } = fieldOptions;
  
  useEffect(() => {
    const fetchLookupDisplayValue = async () => {
      if (!value || !target_object_type_id) {
        setDisplayValue(value || "-");
        setIsLoading(false);
        return;
      }
      
      try {
        // Get the object type to determine default display field
        const { data: objectType } = await supabase
          .from("object_types")
          .select("default_field_api_name")
          .eq("id", target_object_type_id)
          .single();
          
        const displayFieldApiName = fieldOptions.display_field_api_name || 
                                   objectType?.default_field_api_name || 
                                   "name";
        
        // Get the field value for the lookup record
        const { data: fieldValue } = await supabase
          .from("object_field_values")
          .select("value")
          .eq("record_id", value)
          .eq("field_api_name", displayFieldApiName)
          .single();
          
        setDisplayValue(fieldValue?.value || value);
      } catch (error) {
        console.error("Error fetching lookup display value:", error);
        setDisplayValue(value);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLookupDisplayValue();
  }, [value, target_object_type_id, fieldOptions]);
  
  if (isLoading) {
    return <Skeleton className="h-4 w-24" />;
  }
  
  return <span>{displayValue || "-"}</span>;
}
