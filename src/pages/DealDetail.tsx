
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency } from "@/lib/utils";

export default function DealDetail() {
  const { id } = useParams();
  const { deals } = useDeals();
  const deal = deals.find(d => d.id === id);

  if (!deal) {
    return <div className="p-4">Deal nicht gefunden</div>;
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{deal.name}</h1>
      </div>

      <Card className="p-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Betrag</h3>
              <p className="text-lg font-semibold">{formatCurrency(deal.amount)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p className="text-lg font-semibold">{deal.status}</p>
            </div>
          </div>

          {deal.accountName && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
              <p className="text-lg">{deal.accountName}</p>
            </div>
          )}

          {deal.contactName && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Kontakt</h3>
              <p className="text-lg">{deal.contactName}</p>
            </div>
          )}

          {deal.closeDate && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Abschlussdatum</h3>
              <p className="text-lg">{new Date(deal.closeDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
