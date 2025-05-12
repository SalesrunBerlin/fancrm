
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ResourceType = "companies" | "persons";

interface CreateResponse {
  id: string;
  [key: string]: any;
}

type CompanyData = {
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  source_url?: string | null;
  website?: string | null;
};

type PersonData = {
  full_name: string;
  company_id?: string | null;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
};

type ResourceData<T extends ResourceType> = 
  T extends "companies" ? CompanyData : 
  T extends "persons" ? PersonData : 
  never;

export function useCrudResource<T extends ResourceType>(resourceType: T) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (data: ResourceData<T>): Promise<CreateResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await supabase
        .from(resourceType)
        .insert(data as any)
        .select();
        
      if (response.error) throw new Error(response.error.message);
      
      if (!response.data || response.data.length === 0) {
        throw new Error("No data returned after insert");
      }
      
      // Type assertion to ensure we're returning the expected shape
      return response.data[0] as CreateResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create resource";
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (id: string, data: Partial<ResourceData<T>>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from(resourceType)
        .update(data as any)
        .eq('id', id);
        
      if (error) throw new Error(error.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update resource";
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from(resourceType)
        .delete()
        .eq('id', id);
        
      if (error) throw new Error(error.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete resource";
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getById = async (id: string): Promise<Record<string, any>> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(resourceType)
        .select()
        .eq('id', id)
        .single();
        
      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get resource";
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getAll = async (): Promise<Record<string, any>[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(resourceType)
        .select();
        
      if (error) throw new Error(error.message);
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get resources";
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    create,
    update,
    remove,
    getById,
    getAll
  };
}
