
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useInitializeObjects() {
  const { toast } = useToast();

  const initializeObjects = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('initialize_standard_objects');
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Standard objects initialized successfully",
      });
    },
    onError: (error) => {
      console.error("Error initializing objects:", error);
      toast({
        title: "Error",
        description: "Failed to initialize standard objects",
        variant: "destructive",
      });
    },
  });

  return {
    initializeObjects,
  };
}
