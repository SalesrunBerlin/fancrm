
import { DealType } from "@/types";
import { DealCard } from "./DealCard";
import { Card } from "@/components/ui/card";

interface DealsKanbanProps {
  deals: DealType[];
  isLoading: boolean;
  groupByField: "status";
  onDealClick: (id: string) => void;
}

export function DealsKanban({ deals, isLoading, groupByField, onDealClick }: DealsKanbanProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty" />
      </div>
    );
  }

  const groupedDeals = deals.reduce((acc, deal) => {
    const key = deal[groupByField];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(deal);
    return acc;
  }, {} as Record<string, DealType[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Object.entries(groupedDeals).map(([status, statusDeals]) => (
        <Card key={status} className="p-4">
          <div className="font-semibold mb-4 flex justify-between items-center">
            <span>{status}</span>
            <span className="text-sm text-muted-foreground">
              {statusDeals.length} {statusDeals.length === 1 ? 'deal' : 'deals'}
            </span>
          </div>
          <div className="space-y-4">
            {statusDeals.map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                onClick={onDealClick}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
