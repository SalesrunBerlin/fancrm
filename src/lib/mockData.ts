
import { supabase } from "@/integrations/supabase/client";

export const fetchData = async (table: string, select: string = '*') => {
  try {
    if (table === 'contacts' || table === 'activities' || table === 'accounts' || table === 'deals') {
      // For legacy tables that are not in the DB schema but used in components
      return [];
    }
    
    // Handle object records specifically
    if (table === 'object_records') {
      const { data, error } = await supabase
        .from(table)
        .select(select);
      
      if (error) throw error;
      return data || [];
    }
    
    // For other tables, use the normal query
    const { data, error } = await supabase
      .from(table as any)
      .select(select);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
};

export const insertData = async (table: string, data: any) => {
  try {
    if (table === 'contacts' || table === 'activities' || table === 'accounts' || table === 'deals') {
      // For legacy tables that are not in the DB schema but used in components
      console.log(`Mock insert into ${table}:`, data);
      return true;
    }
    
    // Handle object records specifically
    if (table === 'object_records') {
      const { error } = await supabase
        .from(table)
        .insert(data);
      
      if (error) throw error;
      return true;
    }
    
    // For other tables, use the normal insert
    const { error } = await supabase
      .from(table as any)
      .insert(data);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return false;
  }
};
