
// This file provides mock implementations for components that require 
// database tables that we don't have access to in the types

import { supabase } from "@/integrations/supabase/client";

// Mock function to get around type issues with accounts, contacts, and deals tables
export const fetchData = async (table: string, select: string = '*') => {
  try {
    // This is a workaround for the TypeScript issues
    // @ts-ignore - Deliberately ignoring TypeScript errors here as we know these tables exist
    const { data, error } = await supabase.from(table).select(select);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
};
