
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductFamilies } from "@/hooks/useProductFamilies";
import { ProductsTable } from "@/components/products/ProductsTable";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { CreateProductForm } from "@/components/products/CreateProductForm";

export default function Products() {
  const { products, isLoading } = useProducts();
  const { productFamilies, initializeProductFamilies } = useProductFamilies();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (productFamilies && productFamilies.length === 0) {
      initializeProductFamilies();
    }
  }, [productFamilies]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Package className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Produkte</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Produkt
        </Button>
      </div>

      <Card className="p-6">
        <ProductsTable products={products || []} isLoading={isLoading} />
      </Card>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Produkt erstellen</DialogTitle>
          </DialogHeader>
          <CreateProductForm onSuccess={() => setShowCreateModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
