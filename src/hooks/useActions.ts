import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PublicActionToken } from "@/types";

export type ActionType = 'new_record' | 'linked_record' | 'mass_action';
export type ActionColor = 
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "warning"
  | "success"
  | "cyan"
  | "teal"
  | "sky"
  | "azure"
  | "cobalt"
  | "navy"
  | "turquoise"
  | "seafoam"
  | "emerald"
  | "lime"
  | "yellow"
  | "olive"
  | "forest"
  | "mint"
  | "sage"
  | "orange"
  | "coral"
  | "maroon"
  | "brown"
  | "crimson"
  | "burgundy"
  | "brick"
  | "sienna"
  | "ochre"
  | "gold"
  | "bronze"
  | "purple"
  | "violet"
  | "indigo"
  | "lavender"
  | "fuchsia"
  | "magenta"
  | "rose"
  | "pink"
  | "plum"
  | "mauve"
  | "slate"
  | "silver"
  | "charcoal";

export interface Action {
  id: string;
  name: string;
  description?: string;
  action_type: ActionType;
  target_object_id: string;
  source_field_id?: string | null;
  lookup_field_id?: string | null;
  color: ActionColor;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface ActionField {
  id: string;
  action_id: string;
  field_id: string;
  is_preselected: boolean;
  is_enabled: boolean;
  default_value?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActionCreateInput {
  name: string;
  description?: string;
  action_type: ActionType;
  target_object_id: string;
  source_field_id?: string | null;
  lookup_field_id?: string | null;
  color?: ActionColor;
  is_public?: boolean;
}

export function useActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Get all actions using the materialized view for better performance
  const { data: actions, refetch } = useQuery({
    queryKey: ["actions"],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("useActions: Fetching all actions");
      const { data, error } = await supabase
        .from("action_metadata_view")
        .select("*")
        .order("action_name", { ascending: true });

      if (error) {
        console.error("Error fetching actions:", error);
        toast.error("Failed to fetch actions");
        return [];
      }

      // Map the materialized view data back to the Action format
      const typedData = data.map(item => ({
        id: item.action_id,
        name: item.action_name,
        description: item.description,
        action_type: item.action_type as ActionType,
        target_object_id: item.target_object_id,
        source_field_id: item.source_field_id,
        lookup_field_id: item.lookup_field_id,
        color: (item.color || 'default') as ActionColor,
        is_public: item.is_public,
        owner_id: user.id, // We don't store this in the view
        created_at: "", // These fields aren't important for the UI
        updated_at: "",
        // Additional metadata from joins
        object_types: {
          name: item.target_object_name,
          api_name: item.target_object_api_name
        }
      }));
      
      return typedData as (Action & { object_types: { name: string; api_name: string } })[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
  });

  // Get actions by object type ID - optimized to use the materialized view
  const getActionsByObjectId = async (objectTypeId: string): Promise<Action[]> => {
    if (!user || !objectTypeId) {
      console.log("useActions.getActionsByObjectId: No user or objectTypeId provided");
      return [];
    }
    
    // Fetch from cache if available
    const existingActions = queryClient.getQueryData<Action[]>(["actions-by-object", objectTypeId]);
    if (existingActions) {
      return existingActions;
    }
    
    try {
      // First get actions where this object is the target (standard global actions)
      const { data: targetActions, error: targetError } = await supabase
        .from("action_metadata_view")
        .select("*")
        .eq("target_object_id", objectTypeId);

      if (targetError) {
        console.error("Error fetching target actions:", targetError);
        throw targetError;
      }

      // Get lookup field details to check for linked record actions
      const { data: objectFields, error: fieldsError } = await supabase
        .from("object_fields")
        .select("id, api_name, options")
        .eq("object_type_id", objectTypeId)
        .eq("data_type", "lookup");
      
      if (fieldsError) {
        console.error("Error fetching object fields:", fieldsError);
      }
      
      // Find source actions (linked record actions)
      const { data: sourceActions, error: sourceError } = await supabase
        .from("action_metadata_view")
        .select("*")
        .eq("action_type", "linked_record")
        .not("source_field_id", "is", null);

      if (sourceError) {
        console.error("Error fetching source actions:", sourceError);
        throw sourceError;
      }

      // Filter source actions based on target object type
      const validSourceActions = sourceActions.filter(action => {
        // Check if the source field options match our current object type
        if (!action.source_field_id) return false;
        
        // Find the corresponding object field
        const field = objectFields?.find(f => f.id === action.source_field_id);
        if (!field) return false;
        
        // Check field options
        try {
          let options = field.options;
          if (typeof options === 'string') {
            options = JSON.parse(options);
          }
          
          if (options && typeof options === 'object' && !Array.isArray(options)) {
            const typedOptions = options as Record<string, any>;
            return typedOptions.target_object_type_id === objectTypeId;
          }
        } catch (e) {
          console.error("Error parsing field options:", e);
        }
        
        return false;
      });

      // Get mass actions that apply to this object type
      const { data: massActions, error: massActionsError } = await supabase
        .from("action_metadata_view")
        .select("*")
        .eq("action_type", "mass_action")
        .eq("target_object_id", objectTypeId);

      if (massActionsError) {
        console.error("Error fetching mass actions:", massActionsError);
      }

      // Convert view data back to Action format and combine
      const convertToAction = (item: any): Action => ({
        id: item.action_id,
        name: item.action_name,
        description: item.description,
        action_type: item.action_type as ActionType,
        target_object_id: item.target_object_id,
        source_field_id: item.source_field_id,
        lookup_field_id: item.lookup_field_id,
        color: (item.color || 'default') as ActionColor,
        is_public: item.is_public,
        owner_id: user.id,
        created_at: "",
        updated_at: ""
      });

      const allActions = [
        ...(targetActions?.map(convertToAction) || []),
        ...validSourceActions.map(convertToAction),
        ...(massActions?.map(convertToAction) || [])
      ];
      
      // Cache the results
      queryClient.setQueryData(["actions-by-object", objectTypeId], allActions);
      
      return allActions;
    } catch (error) {
      console.error("Exception in getActionsByObjectId:", error);
      throw error;
    }
  };

  // Get action by token
  const getActionByToken = async (token: string): Promise<Action | null> => {
    try {
      console.log(`useActions: Fetching action by token ${token}`);
      const { data: tokenData, error: tokenError } = await supabase
        .from("public_action_tokens")
        .select("action_id, is_active, expires_at")
        .eq("token", token)
        .single();

      if (tokenError) {
        console.error("Error fetching action token:", tokenError);
        return null;
      }

      if (!tokenData.is_active || (tokenData.expires_at && new Date(tokenData.expires_at) < new Date())) {
        console.error("Token is inactive or expired");
        return null;
      }

      const { data: actionData, error: actionError } = await supabase
        .from("actions")
        .select("*")
        .eq("id", tokenData.action_id)
        .eq("is_public", true)
        .single();

      if (actionError) {
        console.error("Error fetching action:", actionError);
        return null;
      }

      return {
        ...actionData,
        color: (actionData.color || 'default') as ActionColor
      } as Action;
    } catch (error) {
      console.error("Error in getActionByToken:", error);
      return null;
    }
  };

  // Get actions for a specific record
  const getActionsByRecordId = async (objectTypeId: string, recordId: string): Promise<Action[]> => {
    if (!user || !objectTypeId || !recordId) return [];

    try {
      // Get all actions for this object type
      const actions = await getActionsByObjectId(objectTypeId);
      
      // Filter actions that are applicable to this specific record
      // For now, we're returning all actions for the object type since we don't have record-specific filtering yet
      return actions;
    } catch (error) {
      console.error("Error getting actions for record:", error);
      return [];
    }
  };

  // Get a single action by ID
  const getAction = async (id: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching action:", error);
        return null;
      }

      // Ensure the color is a valid ActionColor
      return { 
        ...data,
        color: (data.color || 'default') as ActionColor 
      } as Action;
    } catch (error) {
      console.error("Error in getAction:", error);
      return null;
    }
  };

  // Create a new action
  const createAction = useMutation({
    mutationFn: async (actionData: ActionCreateInput) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      // Ensure color has a default value if not provided and set is_public if provided
      const dataWithDefaults = {
        ...actionData,
        color: (actionData.color || 'default') as ActionColor,
        owner_id: user.id,
        is_public: actionData.is_public || false
      };
      
      const { data, error } = await supabase
        .from("actions")
        .insert(dataWithDefaults)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Ensure the color is a valid ActionColor
      return { 
        ...data,
        color: (data.color || 'default') as ActionColor 
      } as Action;
    },
    onSuccess: () => {
      toast.success("Action created successfully");
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (error) => {
      toast.error("Failed to create action");
      console.error("Error creating action:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Update an action
  const updateAction = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Action> & { id: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { data: updatedData, error } = await supabase
        .from("actions")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...updatedData,
        color: (updatedData.color || 'default') as ActionColor
      } as Action;
    },
    onSuccess: () => {
      toast.success("Action updated successfully");
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (error) => {
      toast.error("Failed to update action");
      console.error("Error updating action:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Delete an action
  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      const { error } = await supabase
        .from("actions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Action deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (error) => {
      toast.error("Failed to delete action");
      console.error("Error deleting action:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Create a public token for an action
  const createPublicToken = useMutation({
    mutationFn: async ({ actionId, name, expiresAt }: { actionId: string, name?: string, expiresAt?: Date }) => {
      if (!user) throw new Error("User not authenticated");
      
      setIsLoading(true);
      
      // Generate a secure random token
      const tokenBytes = new Uint8Array(24);
      window.crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { data, error } = await supabase
        .from("public_action_tokens")
        .insert({
          action_id: actionId,
          token,
          name: name || null,
          created_by: user.id,
          expires_at: expiresAt ? expiresAt.toISOString() : null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as PublicActionToken;
    },
    onSuccess: () => {
      toast.success("Public link created successfully");
      queryClient.invalidateQueries({ queryKey: ["action-tokens"] });
    },
    onError: (error) => {
      toast.error("Failed to create public link");
      console.error("Error creating public token:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Get tokens for an action
  const getActionTokens = async (actionId: string): Promise<PublicActionToken[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from("public_action_tokens")
        .select("*")
        .eq("action_id", actionId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data as PublicActionToken[];
    } catch (error) {
      console.error("Error fetching action tokens:", error);
      return [];
    }
  };

  // Deactivate a public token
  const deactivateToken = useMutation({
    mutationFn: async (tokenId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("public_action_tokens")
        .update({ is_active: false })
        .eq("id", tokenId);
      
      if (error) throw error;
      
      return tokenId;
    },
    onSuccess: () => {
      toast.success("Token deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["action-tokens"] });
    },
    onError: (error) => {
      toast.error("Failed to deactivate token");
      console.error("Error deactivating token:", error);
    }
  });

  return {
    actions,
    getAction,
    getActionsByObjectId,
    getActionsByRecordId,
    getActionByToken,
    createAction,
    updateAction,
    deleteAction,
    createPublicToken,
    getActionTokens,
    deactivateToken,
    refetch,
    isLoading,
  };
}
