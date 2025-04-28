
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

// Helper function to insert data into tables that aren't in TypeScript definitions
export const insertData = async (table: string, data: any) => {
  try {
    // @ts-ignore - Deliberately ignoring TypeScript errors here
    const { error } = await supabase.from(table).insert(data);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return false;
  }
};
