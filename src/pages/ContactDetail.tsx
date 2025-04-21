import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ContactInfo } from "@/components/contacts/ContactInfo";
import { useContacts } from "@/hooks/useContacts";
import { useAccounts } from "@/hooks/useAccounts";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { DealsList } from "@/components/common/DealsList";
import { useDeals } from "@/hooks/useDeals";

export default function ContactDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { data: deals } = useDeals();
  const { data: contacts, isLoading: isLoadingContacts } = useContacts();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const contact = contacts?.find(c => c.id === id);
  const account = accounts?.find(a => a.id === contact?.accountId);

  useEffect(() => {
    if (!contact && !isLoadingContacts) {
      toast({
        title: "Error",
        description: "Contact not found.",
        variant: "destructive",
      });
      navigate("/contacts");
    }
  }, [contact, isLoadingContacts, navigate, toast]);

  const handleDelete = () => {
    // TODO: Implement delete contact functionality
    console.log("Delete contact", id);
    setShowDeleteDialog(false);
  };

  if (!contact || isLoadingContacts || isLoadingAccounts) {
    return <div>Loading...</div>;
  }

  const contactDeals = deals?.filter(deal => deal.contactId === id) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="space-x-2">
          <Button variant="secondary" size="icon" onClick={() => console.log("Edit contact", id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <ContactInfo
          contact={contact}
          ownerName={account?.name || null}
        />
      </Card>

      <DealsList 
        deals={contactDeals}
        title="Kontakt Deals"
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This action cannot be undone."
      />
    </div>
  );
}
