
import { DealType } from "@/types";
import { TabsContent } from "@/components/ui/tabs";
import { DealsContent } from "@/components/deals/DealsContent";

interface DealsTabContentProps {
  deals: DealType[];
  isLoading: boolean;
  viewMode: "grid" | "table";
  onDealClick: (id: string) => void;
}

export function DealsTabContent({ deals, isLoading, viewMode, onDealClick }: DealsTabContentProps) {
  return (
    <>
      <TabsContent value="all" className="space-y-4">
        <DealsContent
          isLoading={isLoading}
          deals={deals}
          viewMode={viewMode}
          onDealClick={onDealClick}
        />
      </TabsContent>

      <TabsContent value="open" className="space-y-4">
        <DealsContent
          isLoading={isLoading}
          deals={deals.filter(deal => 
            deal.status !== "Closed Won" && deal.status !== "Closed Lost"
          )}
          viewMode={viewMode}
          onDealClick={onDealClick}
        />
      </TabsContent>

      <TabsContent value="won" className="space-y-4">
        <DealsContent
          isLoading={isLoading}
          deals={deals.filter(deal => deal.status === "Closed Won")}
          viewMode={viewMode}
          onDealClick={onDealClick}
        />
      </TabsContent>

      <TabsContent value="lost" className="space-y-4">
        <DealsContent
          isLoading={isLoading}
          deals={deals.filter(deal => deal.status === "Closed Lost")}
          viewMode={viewMode}
          onDealClick={onDealClick}
        />
      </TabsContent>
    </>
  );
}
