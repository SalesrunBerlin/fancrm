
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealType } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface RecentDealsProps {
  deals: DealType[];
}

export function RecentDeals({ deals }: RecentDealsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deals && deals.length > 0 ? (
            deals.slice(0, 3).map((deal) => (
              <div key={deal.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{deal.name}</p>
                  <p className="text-sm text-muted-foreground">{deal.accountName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(deal.amount)}</p>
                  <p className="text-sm text-muted-foreground">{deal.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No deals found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
