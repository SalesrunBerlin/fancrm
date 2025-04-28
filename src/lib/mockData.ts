
import { supabase } from "@/integrations/supabase/client";

export const fetchData = async (table: string, select: string = '*') => {
  try {
    // Handle object records specifically
    if (table === 'object_records') {
      const { data, error } = await supabase
        .from(table)
        .select(select);
      
      if (error) throw error;
      return data || [];
    }
    
    // For other tables, use the normal query
    // @ts-ignore - We know these tables exist
    const { data, error } = await supabase.from(table).select(select);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
};

export const insertData = async (table: string, data: any) => {
  try {
    // Handle object records specifically
    if (table === 'object_records') {
      const { error } = await supabase
        .from(table)
        .insert(data);
      
      if (error) throw error;
      return true;
    }
    
    // For other tables, use the normal insert
    // @ts-ignore - We know these tables exist
    const { error } = await supabase.from(table).insert(data);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return false;
  }
};
