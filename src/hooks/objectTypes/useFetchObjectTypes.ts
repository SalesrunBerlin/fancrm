
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ObjectType } from "./types";

export function useFetchObjectTypes() {
  const { user } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  
  useEffect(() => {
    if (user) {
      setAuthReady(true);
    }
  }, [user]);

  // Fetch user's object types
  const { data: objectTypes, isLoading } = useQuery({
    queryKey: ["object-types"],
    queryFn: async () => {
      if (!user) {
        console.log("No user, skipping object types fetch");
        return [];
      }
      console.log("Fetching object types for user:", user.id);
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .or(`is_system.eq.true,owner_id.eq.${user.id}`)
        .order("name");

      if (error) {
        console.error("Error fetching object types:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} object types`);
      return data;
    },
    enabled: !!user,
  });

  // Fetch published objects from other users
  const { 
    data: publishedObjects, 
    isLoading: isLoadingPublished,
    refetch: refetchPublished
  } = useQuery({
    queryKey: ["published-objects"],
    queryFn: async () => {
      if (!user) {
        console.log("No user, skipping published objects fetch");
        return [];
      }
      console.log("Fetching published objects. Current user:", user.id);
      
      try {
        const { data, error } = await supabase
          .from("object_types")
          .select("*")
          .eq("is_published", true)
          .neq("owner_id", user.id)
          .order("name");
  
        if (error) {
          console.error("Error fetching published objects:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} published objects`);
        return data;
      } catch (err) {
        console.error("Exception in published objects fetch:", err);
        throw err;
      }
    },
    enabled: !!user && authReady,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const refreshPublishedObjects = async () => {
    console.log("Manually refreshing published objects...");
    try {
      // Force refresh the published objects view
      const { error: refreshError } = await supabase.rpc('refresh_published_objects_view');
      if (refreshError) {
        console.warn("Error refreshing published objects view:", refreshError);
      }
      
      // Refetch the published objects
      const result = await refetchPublished();
      return result;
    } catch (error) {
      console.error("Error during manual refresh:", error);
      throw error;
    }
  };

  return {
    objectTypes,
    isLoading,
    publishedObjects,
    isLoadingPublished,
    refreshPublishedObjects
  };
}
