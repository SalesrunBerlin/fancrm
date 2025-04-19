
import { DealType } from "@/types";
import { DealCard } from "./DealCard";
import { DealsTable } from "./DealsTable";
import { Skeleton } from "@/components/ui/skeleton";

interface DealsContentProps {
  isLoading: boolean;
  deals: DealType[];
  viewMode: "grid" | "table";
  onDealClick: (id: string) => void;
}

export function DealsContent({ isLoading, deals, viewMode, onDealClick }: DealsContentProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty" />
      </div>
    );
  }

  return viewMode === "grid" ? (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {deals.map((deal) => (
        <DealCard 
          key={deal.id} 
          deal={deal} 
          onClick={onDealClick}
        />
      ))}
    </div>
  ) : (
    <DealsTable deals={deals} onDealClick={onDealClick} />
  );
}
