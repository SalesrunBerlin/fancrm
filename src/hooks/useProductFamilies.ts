
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductFamily } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useProductFamilies() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: productFamilies, isLoading } = useQuery({
    queryKey: ["productFamilies"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User must be logged in");

      const { data, error } = await supabase
        .from('product_families')
        .select('*')
        .order('order_position');

      if (error) throw error;

      return data.map(family => ({
        id: family.id,
        name: family.name,
        orderPosition: family.order_position,
        createdAt: family.created_at,
        updatedAt: family.updated_at,
      }));
    },
  });

  const initializeProductFamilies = async () => {
    try {
      const { error } = await supabase.rpc('initialize_product_families');
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["productFamilies"] });
    } catch (error) {
      console.error("Error initializing product families:", error);
      toast({
        title: "Fehler",
        description: "Produktfamilien konnten nicht initialisiert werden",
        variant: "destructive",
      });
    }
  };

  return {
    productFamilies,
    isLoading,
    initializeProductFamilies,
  };
}
