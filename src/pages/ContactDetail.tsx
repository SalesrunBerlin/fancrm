
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, X } from "lucide-react";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useContactDetails } from "@/hooks/useContactDetails";
import { ContactInfo } from "@/components/contacts/ContactInfo";
import { ContactEditForm } from "@/components/contacts/ContactEditForm";

export default function ContactDetail() {
  const {
    contact,
    editedContact,
    ownerName,
    accounts,
    isLoading,
    handleDelete,
    handleSave,
    handleFieldChange,
    navigate
  } = useContactDetails();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset the edited contact to the current contact data
    // We don't need to call setEditedContact directly as it's handled in the hook
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!contact) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p>Contact not found</p>
            <Button onClick={() => navigate(-1)} className="mt-4">Go back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="mb-2" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle>Contact Details</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleEdit}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleSave();
                  setIsEditing(false);
                }}>
                  Save
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <ContactInfo contact={contact} ownerName={ownerName} />
          ) : (
            <ContactEditForm 
              editedContact={editedContact}
              accounts={accounts}
              onFieldChange={handleFieldChange}
            />
          )}
        </CardContent>
      </Card>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Kontakt löschen"
        description="Sind Sie sicher, dass Sie diesen Kontakt löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </div>
  );
}
