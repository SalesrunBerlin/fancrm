
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";
import { useDeals } from "@/hooks/useDeals";
import { useToast } from "@/hooks/use-toast";
import { DealsFilter } from "@/components/deals/DealsFilter";
import { DealsViewToggle } from "@/components/deals/DealsViewToggle";
import { DealsTabContent } from "@/components/deals/DealsTabContent";
import { CreateDealForm } from "@/components/deals/CreateDealForm";

export default function Deals() {
  const { toast } = useToast();
  const { data: deals, isLoading } = useDeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const filteredDeals = deals ? deals.filter(deal => {
    return deal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (deal.accountName && deal.accountName.toLowerCase().includes(searchQuery.toLowerCase())) ||
           deal.status.toLowerCase().includes(searchQuery.toLowerCase());
  }) : [];

  const handleDealClick = (id: string) => {
    toast({
      title: "Deal Selected",
      description: `You clicked on deal with ID: ${id}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Briefcase className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>
      
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
        <DealsTabContent
          deals={filteredDeals}
          isLoading={isLoading}
          viewMode={viewMode}
          onDealClick={handleDealClick}
        />
      </Tabs>

      {showCreateModal && (
        <CreateDealForm onSuccess={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
