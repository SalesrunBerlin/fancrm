
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { AccountsHeader } from "@/components/accounts/AccountsHeader";
import { AccountsFilter } from "@/components/accounts/AccountsFilter";
import { AccountsContent } from "@/components/accounts/AccountsContent";
import { useAccounts } from "@/hooks/useAccounts";
import { TabsContent, Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Accounts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { data: accounts = [], isLoading, error } = useAccounts();
  
  // Add console logging to debug account data
  console.log("Accounts data:", accounts);

  const filteredAccounts = accounts.filter(account => {
    return account.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (account.type && account.type.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  return (
    <div className="space-y-6 animate-fade-in">
      <AccountsHeader />
      
      <AccountsFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>
            Fehler beim Laden der Accounts. Bitte versuchen Sie es später erneut.
          </AlertDescription>
        </Alert>
      ) : (
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
              />
            )}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            <AccountsContent 
              accounts={filteredAccounts.filter(account => account.tags?.includes("Active"))}
              viewMode={viewMode}
            />
          </TabsContent>
          
          <TabsContent value="prospects" className="space-y-4">
            <AccountsContent 
              accounts={filteredAccounts.filter(account => account.tags?.includes("Prospect"))}
              viewMode={viewMode}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
