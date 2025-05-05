
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
    console.log("Generating auto-number for field:", fieldId);
    
    // Hole die Auto-Number-Konfiguration
    const { data: config, error: configError } = await supabase
      .from('auto_number_configurations')
      .select('*')
      .eq('field_id', fieldId)
      .single();
      
    if (configError) {
      console.error("Error fetching auto-number configuration:", configError);
      throw configError;
    }
    
    if (!config) {
      console.error('Auto-number configuration not found for field:', fieldId);
      throw new Error('Auto-number configuration not found');
    }
    
    console.log("Found configuration:", config);
    
    // Rufe die Funktion auf, um eine neue Auto-Number zu generieren
    const { data, error } = await supabase
      .rpc('generate_auto_number', {
        field_id: fieldId,
        prefix: config.prefix || '',
        format_pattern: config.format_pattern || '0000'
      });
      
    if (error) {
      console.error("Error generating auto-number:", error);
      throw error;
    }
    
    console.log("Generated auto-number:", data);
    
    return data;
  } catch (err) {
    console.error('Error generating auto-number:', err);
    throw err;
  }
}
