
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Briefcase } from "lucide-react";
import { DealCard } from "@/components/deals/DealCard";
import { mockDeals } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { DealType } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function Deals() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  const filteredDeals = mockDeals.filter(deal => {
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

  const handleAddNew = () => {
    toast({
      title: "Create New Deal",
      description: "This would open a form to create a new deal.",
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Briefcase className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
        </div>
        <Button onClick={handleAddNew} className="bg-beauty hover:bg-beauty-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
            
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="won">Won</TabsTrigger>
                <TabsTrigger value="lost">Lost</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-beauty hover:bg-beauty-dark" : ""}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "bg-beauty hover:bg-beauty-dark" : ""}
              >
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsContent value="all" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeals.map((deal) => (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  onClick={handleDealClick}
                />
              ))}
            </div>
          ) : (
            <DealsTable deals={filteredDeals} onDealClick={handleDealClick} />
          )}
        </TabsContent>
        
        <TabsContent value="open" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeals
                .filter(deal => deal.status !== "Closed Won" && deal.status !== "Closed Lost")
                .map((deal) => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal} 
                    onClick={handleDealClick}
                  />
                ))}
            </div>
          ) : (
            <DealsTable 
              deals={filteredDeals.filter(deal => deal.status !== "Closed Won" && deal.status !== "Closed Lost")} 
              onDealClick={handleDealClick} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="won" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeals
                .filter(deal => deal.status === "Closed Won")
                .map((deal) => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal} 
                    onClick={handleDealClick}
                  />
                ))}
            </div>
          ) : (
            <DealsTable 
              deals={filteredDeals.filter(deal => deal.status === "Closed Won")} 
              onDealClick={handleDealClick} 
            />
          )}
        </TabsContent>

        <TabsContent value="lost" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeals
                .filter(deal => deal.status === "Closed Lost")
                .map((deal) => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal} 
                    onClick={handleDealClick}
                  />
                ))}
            </div>
          ) : (
            <DealsTable 
              deals={filteredDeals.filter(deal => deal.status === "Closed Lost")} 
              onDealClick={handleDealClick} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DealsTableProps {
  deals: DealType[];
  onDealClick: (id: string) => void;
}

function DealsTable({ deals, onDealClick }: DealsTableProps) {
  return (
    <div className="crm-table-wrapper">
      <table className="crm-table">
        <thead className="crm-table-header">
          <tr className="crm-table-row">
            <th className="crm-table-head">Name</th>
            <th className="crm-table-head">Amount</th>
            <th className="crm-table-head">Status</th>
            <th className="crm-table-head">Account</th>
            <th className="crm-table-head">Close Date</th>
          </tr>
        </thead>
        <tbody className="crm-table-body">
          {deals.map((deal) => (
            <tr 
              key={deal.id} 
              className="crm-table-row cursor-pointer" 
              onClick={() => onDealClick(deal.id)}
            >
              <td className="crm-table-cell font-medium">
                {deal.name}
              </td>
              <td className="crm-table-cell">{formatCurrency(deal.amount)}</td>
              <td className="crm-table-cell">
                <span className={
                  deal.status === "Closed Won" ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" : 
                  deal.status === "Closed Lost" ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" : 
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-beauty-light text-beauty-dark"
                }>
                  {deal.status}
                </span>
              </td>
              <td className="crm-table-cell">{deal.accountName || "-"}</td>
              <td className="crm-table-cell">
                {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
