
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
import { DealsKanban } from "@/components/deals/DealsKanban";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";

export default function Deals() {
  const { toast } = useToast();
  const { data: deals, isLoading } = useDeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table" | "kanban">("kanban");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupByField, setGroupByField] = useState<"status">("status");
  
  const filteredDeals = deals ? deals.filter(deal => {
    const searchLower = searchQuery.toLowerCase();
    return deal.name.toLowerCase().includes(searchLower) || 
           (deal.accountName && deal.accountName.toLowerCase().includes(searchLower)) ||
           deal.status.toLowerCase().includes(searchLower) ||
           (deal.tags && deal.tags.some(tag => tag.toLowerCase().includes(searchLower)));
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
            
            <div className="flex items-center gap-4">
              {viewMode === "kanban" && (
                <Select
                  value={groupByField}
                  onValueChange={(value: "status") => setGroupByField(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <DealsViewToggle 
                viewMode={viewMode}
                onViewChange={setViewMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {viewMode === "kanban" ? (
        <DealsKanban 
          deals={filteredDeals}
          isLoading={isLoading}
          groupByField={groupByField}
          onDealClick={handleDealClick}
        />
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="won">Won</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
          </TabsList>
          
          <DealsTabContent
            deals={filteredDeals}
            isLoading={isLoading}
            viewMode={viewMode}
            onDealClick={handleDealClick}
          />
        </Tabs>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          <CreateDealForm onSuccess={() => setShowCreateModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
