
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { AccountsHeader } from "@/components/accounts/AccountsHeader";
import { AccountsFilter } from "@/components/accounts/AccountsFilter";
import { AccountsContent } from "@/components/accounts/AccountsContent";
import { useAccounts } from "@/hooks/useAccounts";
import { TabsContent, Tabs } from "@/components/ui/tabs";

export default function Accounts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { data: accounts = [], isLoading, error } = useAccounts();
  
  // Add console logging to debug account data
  console.log("Accounts data:", accounts);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Lädt Accounts...</div>;
  }
  
  if (error) {
    console.error("Error loading accounts:", error);
    return <div className="text-red-500">Fehler beim Laden der Accounts.</div>;
  }
  
  const filteredAccounts = accounts.filter(account => {
    return account.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (account.type && account.type.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  const handleAccountClick = (id: string) => {
    toast({
      title: "Account Selected",
      description: `You clicked on account with ID: ${id}`,
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <AccountsHeader />
      
      <AccountsFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsContent value="all" className="space-y-4">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Keine Accounts gefunden. Erstellen Sie einen neuen Account mit dem Button oben.
            </div>
          ) : (
            <AccountsContent 
              accounts={filteredAccounts}
              viewMode={viewMode}
              onAccountClick={handleAccountClick}
            />
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <AccountsContent 
            accounts={filteredAccounts.filter(account => account.tags?.includes("Active"))}
            viewMode={viewMode}
            onAccountClick={handleAccountClick}
          />
        </TabsContent>
        
        <TabsContent value="prospects" className="space-y-4">
          <AccountsContent 
            accounts={filteredAccounts.filter(account => account.tags?.includes("Prospect"))}
            viewMode={viewMode}
            onAccountClick={handleAccountClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
