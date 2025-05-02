
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useInitializeObjects() {
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeStandardObjects = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User must be logged in to initialize objects");
      }
      
      setIsInitializing(true);
      try {
        const { data, error } = await supabase.rpc('initialize_standard_objects', {
          owner_id: user.id
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        // Fix the error handling to properly type the error
        let errorMessage = "An unexpected error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error);
        }
        
        toast.error("Error initializing objects", {
          description: errorMessage
        });
        throw new Error(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    },
    onSuccess: () => {
      toast.success("Standard objects initialized", {
        description: "The standard objects have been created in your account."
      });
    }
  });

  return {
    initializeStandardObjects,
    isInitializing
  };
}
