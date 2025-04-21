
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User must be logged in to fetch products");

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_family:product_family_id (
            id,
            name,
            order_position
          )
        `);

      if (error) throw error;

      return data.map(product => ({
        id: product.id,
        name: product.name,
        recurrence: product.recurrence,
        productFamilyId: product.product_family_id,
        price: Number(product.price),
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        productFamily: product.product_family ? {
          id: product.product_family.id,
          name: product.product_family.name,
          orderPosition: product.product_family.order_position,
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        } : undefined,
      }));
    },
  });

  const createProduct = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User must be logged in to create a product");

      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          recurrence: newProduct.recurrence,
          product_family_id: newProduct.productFamilyId,
          price: newProduct.price,
          owner_id: user.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    products,
    isLoading,
    createProduct,
  };
}
