
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { AccountsHeader } from "@/components/accounts/AccountsHeader";
import { AccountsFilter } from "@/components/accounts/AccountsFilter";
import { AccountsContent } from "@/components/accounts/AccountsContent";
import { CreateAccountForm } from "@/components/accounts/CreateAccountForm";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAccounts } from "@/hooks/useAccounts";

export default function Accounts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: accounts = [], isLoading, error } = useAccounts();
  
  const filteredAccounts = accounts.filter(account => {
    return account.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (account.type && account.type.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>
      
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error loading accounts. Please try again later.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsContent value="all" className="space-y-4">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No accounts found.
              </div>
            ) : (
              <AccountsContent 
                accounts={filteredAccounts}
                viewMode={viewMode}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      {showCreateModal && (
        <CreateAccountForm 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}
    </div>
  );
}
