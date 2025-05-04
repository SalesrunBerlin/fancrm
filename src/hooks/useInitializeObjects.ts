
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useInitializeObjects() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const initializeStandardObjects = async () => {
    setIsInitializing(true);
    setInitializationError(null);

    try {
      const { error } = await supabase.rpc('initialize_standard_objects');
      
      if (error) {
        console.error('Error initializing standard objects:', error);
        setInitializationError(error.message);
        throw error;
      }
      
      toast.success('Standard objects initialized successfully');
      return true;
    } catch (error) {
      console.error('Error in initializeStandardObjects:', error);
      setInitializationError(error instanceof Error ? error.message : "Unknown error occurred");
      toast.error('Failed to initialize standard objects');
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    isInitializing,
    initializationError,
    initializeStandardObjects
  };
}
