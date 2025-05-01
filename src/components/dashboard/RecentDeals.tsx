
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

interface RecentDealsProps {
  deals: DealType[];
}

export function RecentDeals({ deals }: RecentDealsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Deals</CardTitle>
        <Link to="/deals" className="text-sm text-muted-foreground hover:text-primary">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deals && deals.length > 0 ? (
            deals.slice(0, 3).map((deal) => (
              <Link key={deal.id} to={`/deals/${deal.id}`}>
                <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium">{deal.name}</p>
                    <p className="text-sm text-muted-foreground">{deal.accountName || deal.account}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(deal.amount || deal.value)}</p>
                    <p className="text-sm text-muted-foreground">{deal.status || deal.stage}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground">No deals found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
