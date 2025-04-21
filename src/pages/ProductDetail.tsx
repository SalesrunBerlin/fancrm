
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateProductForm } from "@/components/products/CreateProductForm";
import { DeleteDialog } from "@/components/common/DeleteDialog";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { products, deleteProduct } = useProducts();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const product = products?.find(p => p.id === id);

  if (!product) {
    return <div className="p-4">Produkt nicht gefunden</div>;
  }

  const getRecurrenceLabel = (recurrence: typeof product.recurrence) => {
    switch (recurrence) {
      case 'once': return 'Einmalig';
      case 'monthly': return 'Monatlich';
      case 'yearly': return 'Jährlich';
      case 'hourly': return 'Stündlich';
      default: return recurrence;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(id!);
      toast({
        title: "Erfolg",
        description: "Produkt wurde gelöscht",
      });
      navigate("/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6 p-6 animate-fade-in">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setIsEditing(false)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <CreateProductForm 
          initialData={product} 
          onSuccess={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div className="space-x-2">
          <Button 
            variant="secondary"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl font-bold">{product.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Preis</h3>
              <p className="text-lg font-semibold">{formatCurrency(product.price)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Turnus</h3>
              <p className="text-lg">{getRecurrenceLabel(product.recurrence)}</p>
            </div>
          </div>

          {product.productFamily && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Produktfamilie</h3>
              <p className="text-lg">{product.productFamily.name}</p>
            </div>
          )}
        </div>
      </Card>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Produkt löschen"
        description="Sind Sie sicher, dass Sie dieses Produkt löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </div>
  );
}
