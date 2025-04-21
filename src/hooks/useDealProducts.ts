
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";

export interface DealProduct {
  id: string;
  dealId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export function useDealProducts(dealId: string) {
  const queryClient = useQueryClient();

  const { data: dealProducts, isLoading } = useQuery({
    queryKey: ["deal-products", dealId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User must be logged in to fetch deal products");

      const { data, error } = await supabase
        .from("deal_products")
        .select(`
          *,
          product:product_id (
            *,
            product_family:product_family_id (
              id,
              name,
              order_position
            )
          )
        `)
        .eq('deal_id', dealId);

      if (error) throw error;

      return data.map(dp => ({
        id: dp.id,
        dealId: dp.deal_id,
        productId: dp.product_id,
        quantity: dp.quantity,
        product: dp.product ? {
          id: dp.product.id,
          name: dp.product.name,
          recurrence: dp.product.recurrence,
          productFamilyId: dp.product.product_family_id,
          price: Number(dp.product.price),
          createdAt: dp.product.created_at,
          updatedAt: dp.product.updated_at,
          productFamily: dp.product.product_family ? {
            id: dp.product.product_family.id,
            name: dp.product.product_family.name,
            orderPosition: dp.product.product_family.order_position,
            createdAt: dp.product.created_at,
            updatedAt: dp.product.updated_at,
          } : undefined,
        } : undefined,
      }));
    },
  });

  const addDealProduct = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string, quantity: number }) => {
      const { error } = await supabase
        .from('deal_products')
        .insert([{
          deal_id: dealId,
          product_id: productId,
          quantity
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-products", dealId] });
    },
  });

  const removeDealProduct = useMutation({
    mutationFn: async (dealProductId: string) => {
      const { error } = await supabase
        .from('deal_products')
        .delete()
        .eq('id', dealProductId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-products", dealId] });
    },
  });

  return {
    dealProducts,
    isLoading,
    addDealProduct,
    removeDealProduct
  };
}
