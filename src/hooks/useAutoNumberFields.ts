
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    // Get the auto-number configuration
    const { data: config } = await supabase
      .from('auto_number_configurations')
      .select('*')
      .eq('field_id', fieldId)
      .single();
      
    if (!config) {
      throw new Error('Auto-number configuration not found');
    }
    
    // Call the function to generate a new auto-number
    const { data, error } = await supabase
      .rpc('generate_auto_number', {
        field_id: fieldId,
        prefix: config.prefix || '',
        format_pattern: config.format_pattern || '0000'
      });
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error generating auto-number:', err);
    throw err;
  }
}
