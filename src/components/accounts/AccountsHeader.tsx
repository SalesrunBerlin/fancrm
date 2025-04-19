
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function AccountsHeader() {
  const { toast } = useToast();

  const handleAddNew = () => {
    toast({
      title: "Create New Account",
      description: "This would open a form to create a new account.",
    });
  };

  return (
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
  );
}
