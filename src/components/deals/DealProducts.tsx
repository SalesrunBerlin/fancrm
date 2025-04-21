
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useDealProducts } from "@/hooks/useDealProducts";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DealProductsProps {
  dealId: string;
}

export function DealProducts({ dealId }: DealProductsProps) {
  const { toast } = useToast();
  const { products } = useProducts();
  const { dealProducts, addDealProduct, removeDealProduct } = useDealProducts(dealId);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const handleAddProduct = async () => {
    if (!selectedProductId) return;

    try {
      await addDealProduct.mutateAsync({ 
        productId: selectedProductId, 
        quantity 
      });
      toast({
        title: "Erfolg",
        description: "Produkt wurde zum Deal hinzugefügt",
      });
      setSelectedProductId("");
      setQuantity(1);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    }
  };

  const handleRemoveProduct = async (dealProductId: string) => {
    try {
      await removeDealProduct.mutateAsync(dealProductId);
      toast({
        title: "Erfolg",
        description: "Produkt wurde entfernt",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht entfernt werden",
        variant: "destructive",
      });
    }
  };

  const totalAmount = dealProducts?.reduce((sum, dp) => {
    if (dp.product) {
      return sum + (dp.product.price * dp.quantity);
    }
    return sum;
  }, 0) || 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Produkte</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Select 
              value={selectedProductId} 
              onValueChange={setSelectedProductId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Produkt auswählen" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-24"
            />
            <Button onClick={handleAddProduct}>
              Hinzufügen
            </Button>
          </div>

          <div className="space-y-2">
            {dealProducts?.map((dealProduct) => (
              <div 
                key={dealProduct.id} 
                className="flex justify-between items-center p-2 border rounded"
              >
                <div>
                  <div className="font-medium">
                    {dealProduct.product?.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dealProduct.quantity} x {formatCurrency(dealProduct.product?.price || 0)} = {formatCurrency((dealProduct.product?.price || 0) * dealProduct.quantity)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveProduct(dealProduct.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {dealProducts && dealProducts.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <div className="text-lg font-semibold">
                Gesamt: {formatCurrency(totalAmount)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
