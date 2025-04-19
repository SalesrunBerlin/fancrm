
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, X } from "lucide-react";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});

  useEffect(() => {
    const fetchContact = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select(`
            *,
            accounts:account_id (
              name
            ),
            profiles:owner_id (
              first_name,
              last_name
            )
          `)
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching contact:", error);
          toast({
            title: "Error",
            description: "Kontakt konnte nicht geladen werden",
            variant: "destructive"
          });
          return;
        }

        if (data) {
          const transformedContact: Contact = {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            accountId: data.account_id,
            accountName: data.accounts?.name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            ownerId: data.owner_id
          };
          setContact(transformedContact);
          setEditedContact(transformedContact);
          
          if (data.profiles) {
            setOwnerName(`${data.profiles.first_name} ${data.profiles.last_name}`.trim());
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [id, toast]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContact(contact || {});
  };

  const handleSave = async () => {
    if (!id || !editedContact) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          first_name: editedContact.firstName,
          last_name: editedContact.lastName,
          email: editedContact.email,
          phone: editedContact.phone,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Kontakt wurde aktualisiert",
      });
      
      setContact({
        ...contact!,
        ...editedContact,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating contact:", err);
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Kontakt wurde gelöscht",
      });
      navigate("/contacts");
    } catch (err) {
      console.error("Error deleting contact:", err);
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (field: keyof Contact, value: string) => {
    setEditedContact(prev => ({
      ...prev,
      [field]: value
    }));
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
                <Button onClick={handleSave}>
                  Save
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isEditing ? (
              <>
                <div>
                  <strong>Name:</strong> {contact.firstName} {contact.lastName}
                </div>
                <div>
                  <strong>Email:</strong> {contact.email || '-'}
                </div>
                <div>
                  <strong>Phone:</strong> {contact.phone || '-'}
                </div>
                {contact.accountName && (
                  <div>
                    <strong>Account:</strong> {contact.accountName}
                  </div>
                )}
                {ownerName && (
                  <div>
                    <strong>Owner:</strong> {ownerName}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    value={editedContact.firstName || ''} 
                    onChange={(e) => handleFieldChange('firstName', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input 
                    value={editedContact.lastName || ''} 
                    onChange={(e) => handleFieldChange('lastName', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    value={editedContact.email || ''} 
                    onChange={(e) => handleFieldChange('email', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    value={editedContact.phone || ''} 
                    onChange={(e) => handleFieldChange('phone', e.target.value)} 
                  />
                </div>
              </>
            )}
          </div>
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
