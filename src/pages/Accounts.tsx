
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building } from "lucide-react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { mockAccounts } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { AccountType } from "@/types";

export default function Accounts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  const filteredAccounts = mockAccounts.filter(account => {
    return account.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (account.type && account.type.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  const handleAccountClick = (id: string) => {
    toast({
      title: "Account Selected",
      description: `You clicked on account with ID: ${id}`,
    });
  };

  const handleAddNew = () => {
    toast({
      title: "Create New Account",
      description: "This would open a form to create a new account.",
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Building className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        </div>
        <Button onClick={handleAddNew} className="bg-beauty hover:bg-beauty-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
            
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="prospects">Prospects</TabsTrigger>
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
              {filteredAccounts.map((account) => (
                <AccountCard 
                  key={account.id} 
                  account={account} 
                  onClick={handleAccountClick}
                />
              ))}
            </div>
          ) : (
            <AccountsTable accounts={filteredAccounts} onAccountClick={handleAccountClick} />
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts
                .filter(account => account.tags?.includes("Active"))
                .map((account) => (
                  <AccountCard 
                    key={account.id} 
                    account={account} 
                    onClick={handleAccountClick}
                  />
                ))}
            </div>
          ) : (
            <AccountsTable 
              accounts={filteredAccounts.filter(account => account.tags?.includes("Active"))} 
              onAccountClick={handleAccountClick} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="prospects" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts
                .filter(account => account.tags?.includes("Prospect"))
                .map((account) => (
                  <AccountCard 
                    key={account.id} 
                    account={account} 
                    onClick={handleAccountClick}
                  />
                ))}
            </div>
          ) : (
            <AccountsTable 
              accounts={filteredAccounts.filter(account => account.tags?.includes("Prospect"))} 
              onAccountClick={handleAccountClick} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AccountsTableProps {
  accounts: AccountType[];
  onAccountClick: (id: string) => void;
}

function AccountsTable({ accounts, onAccountClick }: AccountsTableProps) {
  return (
    <div className="crm-table-wrapper">
      <table className="crm-table">
        <thead className="crm-table-header">
          <tr className="crm-table-row">
            <th className="crm-table-head">Name</th>
            <th className="crm-table-head">Type</th>
            <th className="crm-table-head">Contacts</th>
            <th className="crm-table-head">Tags</th>
          </tr>
        </thead>
        <tbody className="crm-table-body">
          {accounts.map((account) => (
            <tr 
              key={account.id} 
              className="crm-table-row cursor-pointer" 
              onClick={() => onAccountClick(account.id)}
            >
              <td className="crm-table-cell font-medium">
                {account.name}
              </td>
              <td className="crm-table-cell">{account.type || "Business"}</td>
              <td className="crm-table-cell">{account.contactCount || 0}</td>
              <td className="crm-table-cell">
                <div className="flex flex-wrap gap-1">
                  {account.tags?.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
