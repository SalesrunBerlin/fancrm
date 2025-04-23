
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Save, Trash2, X } from "lucide-react";
import { ContactInfo } from "@/components/contacts/ContactInfo";
import { ContactEditForm } from "@/components/contacts/ContactEditForm";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { DealsList } from "@/components/common/DealsList";
import { useDeals } from "@/hooks/useDeals";
import { useContactDetails } from "@/hooks/useContactDetails";

export default function ContactDetail() {
  const navigate = useNavigate();
  const { 
    contact, 
    editedContact, 
    ownerName, 
    accounts, 
    isLoading, 
    handleDelete, 
    handleSave, 
    handleFieldChange,
    handleAddressBlur,
    isAddressLoading
  } = useContactDetails();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { data: deals } = useDeals();

  if (isLoading) {
    return <div className="p-6 text-center">Loading contact...</div>;
  }

  if (!contact) {
    return <div className="p-6 text-center">Contact not found</div>;
  }

  const contactDeals = deals?.filter(deal => deal.contactId === contact.id) || [];

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveAndClose = () => {
    handleSave();
    setIsEditing(false);
  };

  console.log("Contact in detail view:", contact);
  console.log("Edited contact in detail view:", editedContact);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="icon" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={handleSaveAndClose}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="icon" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-6">
        {isEditing ? (
          <CardContent>
            <ContactEditForm
              editedContact={editedContact}
              accounts={accounts}
              onFieldChange={handleFieldChange}
              onAddressBlur={handleAddressBlur}
              isAddressLoading={isAddressLoading}
            />
          </CardContent>
        ) : (
          <ContactInfo
            contact={contact}
            ownerName={ownerName}
          />
        )}
      </Card>

      <DealsList 
        deals={contactDeals}
        title="Contact Deals"
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
