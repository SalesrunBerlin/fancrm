
import { DealType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DealsListProps {
  deals: DealType[];
  title?: string;
}

export function DealsList({ deals, title = "Deals" }: DealsListProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deals.length > 0 ? (
            deals.map((deal) => (
              <div
                key={deal.id}
                className="flex justify-between items-center p-3 border rounded cursor-pointer hover:bg-accent"
                onClick={() => navigate(`/deals/${deal.id}`)}
              >
                <div>
                  <div className="font-medium">{deal.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(deal.amount)} - {deal.status}
                  </div>
                </div>
                {deal.closeDate && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    {new Date(deal.closeDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Keine Deals vorhanden
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
