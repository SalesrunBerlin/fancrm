import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/useAccounts";
import { useContacts } from "@/hooks/useContacts";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { AccountContacts } from "@/components/accounts/AccountContacts";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { DealsList } from "@/components/common/DealsList";
import { useDeals } from "@/hooks/useDeals";

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: accounts, isLoading } = useAccounts();
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const account = accounts?.find(a => a.id === id);
  const accountContacts = contacts?.filter(c => c.accountId === id) || [];
  const accountDeals = deals?.filter(deal => deal.accountId === id) || [];

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!account) {
    return <div className="p-4">Account not found</div>;
  }

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
            variant="secondary"
            size="icon"
            onClick={() => {/* Edit account logic */}}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{account.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {account.industry && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Industry</h3>
                <p>{account.industry}</p>
              </div>
            )}
            {account.website && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                <p>{account.website}</p>
              </div>
            )}
            {account.type && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                <p>{account.type}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AccountContacts
        contacts={accountContacts}
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
