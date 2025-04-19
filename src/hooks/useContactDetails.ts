
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/lib/types/database";
import { useToast } from "@/hooks/use-toast";

export function useContactDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Array<{ id: string, name: string }>>([]);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name");
      
      if (error) {
        console.error("Error fetching accounts:", error);
        return;
      }
      
      setAccounts(data || []);
    };

    fetchAccounts();
  }, []);

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
          account_id: editedContact.accountId,
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
    } catch (err) {
      console.error("Error updating contact:", err);
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht aktualisiert werden",
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

  return {
    contact,
    editedContact,
    ownerName,
    accounts,
    isLoading,
    handleDelete,
    handleSave,
    handleFieldChange,
    navigate
  };
}
