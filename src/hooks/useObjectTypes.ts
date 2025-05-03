import { useQuery, useMutation, QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ObjectType {
  id: string;
  name: string;
  api_name: string;
  description?: string;
  icon?: string;
  is_system?: boolean;
  is_active?: boolean;
  is_archived?: boolean;
  show_in_navigation?: boolean;
  is_published?: boolean;
  is_template?: boolean;
  source_object_id?: string;
  owner_id?: string;
  default_field_api_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ObjectField {
  id: string;
  object_type_id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required?: boolean;
  is_system?: boolean;
  default_value?: string | null;
  options?: any;
  display_order?: number;
  owner_id?: string;
  created_at?: string;
}

export function useObjectTypes() {
  const { user } = useAuth();
  
  // Fetch object types - now with improved visibility rules
  const { data: objectTypes, isLoading, error, refetch } = useQuery({
    queryKey: ["object-types"],
    queryFn: async () => {
      // Only proceed if user is authenticated
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .or(`owner_id.eq.${user.id},is_published.eq.true,is_system.eq.true`)
        .order("name");
      
      if (error) throw error;
      return data as ObjectType[];
    },
    enabled: !!user
  });

  // Fetch specifically published objects by other users
  const { data: publishedObjects, isLoading: isLoadingPublished } = useQuery({
    queryKey: ["published-objects"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .eq("is_published", true)
        .neq("owner_id", user.id)
        .order("name");
      
      if (error) throw error;
      return data as ObjectType[];
    },
    enabled: !!user
  });

  // Create object type mutation
  const createObjectType = useMutation({
    mutationFn: async (objectType: Omit<ObjectType, "id" | "created_at" | "updated_at">) => {
      try {
        // Verify user is authenticated
        if (!user) {
          throw new Error("Authentication required to create object types");
        }
        
        // Ensure owner_id is set to current user
        if (!objectType.owner_id) {
          objectType.owner_id = user.id;
        }
        
        console.log("Creating object type with owner_id:", objectType.owner_id);
        
        const { data, error } = await supabase
          .from("object_types")
          .insert(objectType)
          .select()
          .single();
        
        if (error) {
          console.error("Supabase error creating object type:", error);
          throw error;
        }
        
        return data as ObjectType;
      } catch (error: any) {
        console.error("Error creating object type:", error);
        
        // Check for RLS policy violations
        if (error.code === 'PGRST301') {
          throw new Error("Permission denied: Row-level security prevents this action");
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      // Refetch object types after successful creation
      refetch();
    },
    onError: (error: any) => {
      console.error("Create object type error:", error);
      toast.error("Failed to create object type", {
        description: error?.message || "Unknown error occurred"
      });
    }
  });

  // Add other mutations like updateObjectType, publishObjectType, etc.
  // We'll implement stub methods for now to fix the type errors

  const updateObjectType = useMutation({
    mutationFn: async (objectType: Partial<ObjectType> & { id: string }) => {
      // Only owners should be able to update
      const { data: existingObject, error: checkError } = await supabase
        .from("object_types")
        .select("owner_id")
        .eq("id", objectType.id)
        .single();
      
      if (checkError) throw checkError;
      
      if (existingObject.owner_id !== user?.id) {
        throw new Error("You don't have permission to update this object");
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .update(objectType)
        .eq("id", objectType.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetch()
  });

  const publishObjectType = useMutation({
    mutationFn: async (id: string) => {
      // Only owners can publish
      const { data: existingObject, error: checkError } = await supabase
        .from("object_types")
        .select("owner_id")
        .eq("id", id)
        .single();
      
      if (checkError) throw checkError;
      
      if (existingObject.owner_id !== user?.id) {
        throw new Error("You don't have permission to publish this object");
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: true })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetch()
  });

  const unpublishObjectType = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: false })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetch()
  });

  const archiveObjectType = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_archived: true })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetch()
  });

  const restoreObjectType = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_archived: false })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetch()
  });

  const deleteObjectType = useMutation({
    mutationFn: async (id: string) => {
      // Only owners can delete
      const { data: existingObject, error: checkError } = await supabase
        .from("object_types")
        .select("owner_id")
        .eq("id", id)
        .single();
      
      if (checkError) throw checkError;
      
      if (existingObject.owner_id !== user?.id) {
        throw new Error("You don't have permission to delete this object");
      }
      
      const { error } = await supabase
        .from("object_types")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => refetch()
  });

  const importObjectType = useMutation({
    mutationFn: async (sourceId: string) => {
      // For now, just a placeholder implementation
      const { data: sourceObject, error: sourceError } = await supabase
        .from("object_types")
        .select("*")
        .eq("id", sourceId)
        .single();
      
      if (sourceError) throw sourceError;
      
      // Clone the object with is_template = true
      const newObject = {
        ...sourceObject,
        is_template: true,
        source_object_id: sourceId,
        owner_id: user?.id // Set current user as owner
      };
      
      delete newObject.id;
      delete newObject.created_at;
      delete newObject.updated_at;
      
      const { data, error } = await supabase
        .from("object_types")
        .insert(newObject)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetch()
  });

  // Filter for published and archived objects
  const archivedObjects = objectTypes?.filter(obj => obj.is_archived) || [];

  return {
    objectTypes,
    isLoading,
    error,
    refetch,
    createObjectType,
    updateObjectType,
    publishObjectType,
    unpublishObjectType,
    publishedObjects,
    isLoadingPublished,
    archiveObjectType,
    restoreObjectType,
    deleteObjectType,
    archivedObjects,
    importObjectType
  };
}
