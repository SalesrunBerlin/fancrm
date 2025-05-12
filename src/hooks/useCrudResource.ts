
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ResourceType = "companies" | "persons";

interface CreateResponse {
  id: string;
  [key: string]: any;
}

export function useCrudResource(resourceType: ResourceType) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (data: Record<string, any>): Promise<CreateResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error } = await supabase
        .from(resourceType)
        .insert(data)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      
      return result as CreateResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create resource";
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (id: string, data: Record<string, any>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from(resourceType)
        .update(data)
        .eq("id", id);
        
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
        .eq("id", id);
        
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
        .eq("id", id)
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
