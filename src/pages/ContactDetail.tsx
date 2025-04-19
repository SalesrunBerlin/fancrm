import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/common/DeleteDialog";

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
            )
          `)
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching contact:", error);
          toast({
            title: "Error",
            description: "Could not load contact details",
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
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [id, toast]);

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
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Name:</strong> {contact.firstName} {contact.lastName}
            </div>
            {contact.email && (
              <div>
                <strong>Email:</strong> {contact.email}
              </div>
            )}
            {contact.phone && (
              <div>
                <strong>Phone:</strong> {contact.phone}
              </div>
            )}
            {contact.accountName && (
              <div>
                <strong>Account:</strong> {contact.accountName}
              </div>
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
