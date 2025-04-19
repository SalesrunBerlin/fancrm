
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDeals } from "@/hooks/useDeals";
import { useToast } from "@/hooks/use-toast";
import { DealType } from "@/types";
import { CreateDealForm } from "@/components/deals/CreateDealForm";
import { DealsHeader } from "@/components/deals/DealsHeader";
import { DealsFilter } from "@/components/deals/DealsFilter";
import { DealsViewToggle } from "@/components/deals/DealsViewToggle";
import { DealsContent } from "@/components/deals/DealsContent";

export default function Deals() {
  const { toast } = useToast();
  const { deals, isLoading } = useDeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const filteredDeals = deals.filter(deal => {
    return deal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (deal.accountName && deal.accountName.toLowerCase().includes(searchQuery.toLowerCase())) ||
           deal.status.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const handleDealClick = (id: string) => {
    toast({
      title: "Deal Selected",
      description: `You clicked on deal with ID: ${id}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DealsHeader onCreateClick={() => setShowCreateForm(true)} />
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <DealsFilter 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="won">Won</TabsTrigger>
                <TabsTrigger value="lost">Lost</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <DealsViewToggle 
              viewMode={viewMode}
              onViewChange={setViewMode}
            />
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsContent value="all" className="space-y-4">
          <DealsContent
            isLoading={isLoading}
            deals={filteredDeals}
            viewMode={viewMode}
            onDealClick={handleDealClick}
          />
        </TabsContent>
        
        <TabsContent value="open" className="space-y-4">
          <DealsContent
            isLoading={isLoading}
            deals={filteredDeals.filter(deal => 
              deal.status !== "Closed Won" && deal.status !== "Closed Lost"
            )}
            viewMode={viewMode}
            onDealClick={handleDealClick}
          />
        </TabsContent>
        
        <TabsContent value="won" className="space-y-4">
          <DealsContent
            isLoading={isLoading}
            deals={filteredDeals.filter(deal => deal.status === "Closed Won")}
            viewMode={viewMode}
            onDealClick={handleDealClick}
          />
        </TabsContent>

        <TabsContent value="lost" className="space-y-4">
          <DealsContent
            isLoading={isLoading}
            deals={filteredDeals.filter(deal => deal.status === "Closed Lost")}
            viewMode={viewMode}
            onDealClick={handleDealClick}
          />
        </TabsContent>
      </Tabs>

      <Sheet open={showCreateForm} onOpenChange={setShowCreateForm}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Deal</SheetTitle>
          </SheetHeader>
          <CreateDealForm onSuccess={() => setShowCreateForm(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
