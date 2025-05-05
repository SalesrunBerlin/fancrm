
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAutoNumberConfig(fieldId: string) {
  return useQuery({
    queryKey: ["auto-number-config", fieldId],
    queryFn: async () => {
      if (!fieldId) return null;
      
      const { data, error } = await supabase
        .from('auto_number_configurations')
        .select('*')
        .eq('field_id', fieldId)
        .single();
        
      if (error) {
        console.error("Error fetching auto-number configuration:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!fieldId,
  });
}

export async function generateAutoNumber(fieldId: string): Promise<string> {
  try {
    console.log("Generating auto-number for field:", fieldId);
    
    // Get auto-number configuration
    const { data: config, error: configError } = await supabase
      .from('auto_number_configurations')
      .select('*')
      .eq('field_id', fieldId)
      .single();
      
    if (configError) {
      console.error("Error fetching auto-number configuration:", configError);
      toast.error("Failed to generate auto-number: Configuration not found");
      throw configError;
    }
    
    if (!config) {
      const errorMsg = 'Auto-number configuration not found for field: ' + fieldId;
      console.error(errorMsg);
      toast.error("Failed to generate auto-number: Configuration not found");
      throw new Error(errorMsg);
    }
    
    console.log("Found configuration:", config);
    
    // Call the function to generate a new auto-number
    const { data, error } = await supabase
      .rpc('generate_auto_number', {
        field_id: fieldId,
        prefix: config.prefix || '',
        format_pattern: config.format_pattern || '0000'
      });
      
    if (error) {
      console.error("Error generating auto-number:", error);
      toast.error("Failed to generate auto-number: " + error.message);
      throw error;
    }
    
    console.log("Generated auto-number:", data);
    
    return data;
  } catch (err: any) {
    console.error('Error generating auto-number:', err);
    toast.error("Auto-number generation failed: " + (err.message || "Unknown error"));
    throw err;
  }
}
