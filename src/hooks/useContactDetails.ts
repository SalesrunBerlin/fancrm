
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
            ownerId: data.owner_id,
            street: data.street,
            city: data.city,
            postal_code: data.postal_code,
            country: data.country,
            latitude: data.latitude,
            longitude: data.longitude
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

  const updateContactGeocode = async (contact: Contact) => {
    if (!contact.street || !contact.city || !contact.postal_code || !contact.country) return;

    const address = `${contact.street}, ${contact.postal_code} ${contact.city}, ${contact.country}`;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg`
      );

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        
        const { error } = await supabase
          .from('contacts')
          .update({ latitude, longitude })
          .eq('id', contact.id);

        if (error) {
          console.error('Error updating coordinates:', error);
        } else {
          setContact(prev => prev ? { ...prev, latitude, longitude } : null);
        }
      }
    } catch (err) {
      console.error('Error geocoding address:', err);
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

  const handleSave = async () => {
    if (!id || !editedContact) return;

    try {
      // Prepare data for update
      const updateData = {
        first_name: editedContact.firstName,
        last_name: editedContact.lastName,
        email: editedContact.email,
        phone: editedContact.phone,
        account_id: editedContact.accountId,
        street: editedContact.street,
        city: editedContact.city,
        postal_code: editedContact.postal_code,
        country: editedContact.country
      };

      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Update the local state with edited contact
      const updatedContact = {
        ...contact!,
        ...editedContact,
      };
      
      setContact(updatedContact);
      
      // Update geocode if address changed
      await updateContactGeocode(updatedContact as Contact);

      toast({
        title: "Erfolg",
        description: "Kontakt wurde aktualisiert",
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
