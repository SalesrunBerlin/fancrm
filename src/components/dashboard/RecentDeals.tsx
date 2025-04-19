
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealType } from "@/types";

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
          {deals.slice(0, 3).map((deal) => (
            <div key={deal.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{deal.name}</p>
                <p className="text-sm text-muted-foreground">{deal.accountName}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${deal.amount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{deal.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
