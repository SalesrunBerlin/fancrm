import { useState } from "react";
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateAccountForm } from "./CreateAccountForm";

export function AccountsHeader() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center">
        <Building className="mr-2 h-6 w-6 text-beauty" />
        <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
      </div>
      <Button onClick={() => setShowCreateModal(true)} className="bg-beauty hover:bg-beauty-dark">
        <Plus className="h-4 w-4" />
      </Button>
      
      <CreateAccountForm 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
