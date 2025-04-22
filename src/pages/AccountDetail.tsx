
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccountDetails } from "@/hooks/useAccountDetails";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { AccountContacts } from "@/components/accounts/AccountContacts";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { DealsList } from "@/components/common/DealsList";
import { useDeals } from "@/hooks/useDeals";
import { AccountDetailInfo } from "@/components/accounts/AccountDetailInfo";
import { Account } from "@/lib/types/database";

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { account, isLoading, updateAccount } = useAccountDetails(id);
  const { data: deals } = useDeals();
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccount, setEditedAccount] = useState<Partial<Account>>({});

  // Initialize the edit form when account data is loaded
  useEffect(() => {
    if (account) {
      setEditedAccount({ ...account });
    }
  }, [account]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!account) {
    return <div className="p-4">Account not found</div>;
  }

  const handleFieldChange = (field: keyof Account, value: string) => {
    setEditedAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateAccount(editedAccount as Account);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      // Delete account logic would go here
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
      navigate("/accounts");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const accountDeals = deals?.filter(deal => deal.accountId === id) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="space-x-2">
          <Button 
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AccountDetailInfo 
        account={account}
        isEditing={isEditing}
        editedAccount={editedAccount}
        onEdit={() => setIsEditing(true)}
        onCancelEdit={() => {
          setIsEditing(false);
          setEditedAccount({...account});
        }}
        onSave={handleSave}
        onEditFieldChange={handleFieldChange}
      />

      <AccountContacts
        contacts={account.contacts || []}
        accountId={id!}
        showContactForm={showContactForm}
        onContactClick={(contactId) => navigate(`/contacts/${contactId}`)}
        onShowContactForm={() => setShowContactForm(true)}
        onHideContactForm={() => setShowContactForm(false)}
        onContactCreated={() => {
          toast({
            title: "Success",
            description: "Contact created successfully",
          });
        }}
      />

      <DealsList 
        deals={accountDeals}
        title="Account Deals"
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Account"
        description="Are you sure you want to delete this account? This action cannot be undone."
      />
    </div>
  );
}
