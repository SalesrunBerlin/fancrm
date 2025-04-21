
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products } = useProducts();
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
    </div>
  );
}
