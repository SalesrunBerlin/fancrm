
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Contact } from "@/lib/types/database";
import { shouldGeocodeAddress, geocodeAndUpdateContact } from "./useContactGeocode";
import { useFetchContactRelations } from "./useFetchContactRelations";
import { supabase } from "@/integrations/supabase/client";

/**
 * Haupt-Hook zur Verwaltung von Kontakt-Details inkl. Änderung, Löschen und Speicher-Logik.
 */
export function useContactDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    contact,
    setContact,
    ownerName,
    accounts,
    isLoading,
  } = useFetchContactRelations(id);

  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});

  // Synchronisiere editedContact, wenn Kontakt geladen
  useEffect(() => {
    if (contact) {
      setEditedContact(contact);
      // Geocoding bei fehlenden Koordinaten auslösen
      if (shouldGeocodeAddress(contact)) {
        geocodeAndUpdateContact(contact, setContact, setEditedContact);
      }
    }
  }, [contact, setContact]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Erfolg", description: "Kontakt wurde gelöscht" });
      navigate("/contacts");
    } catch {
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
      const updateData = {
        first_name: editedContact.firstName,
        last_name: editedContact.lastName,
        email: editedContact.email,
        phone: editedContact.phone,
        account_id: editedContact.accountId,
        street: editedContact.street,
        city: editedContact.city,
        postal_code: editedContact.postal_code,
        country: editedContact.country,
      };
      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      const updatedContact = { ...contact!, ...editedContact };
      setContact(updatedContact as Contact);

      // Geocode falls Adresse verändert wurde
      if (shouldGeocodeAddress(updatedContact as Contact)) {
        await geocodeAndUpdateContact(updatedContact as Contact, setContact, setEditedContact);
      }

      toast({ title: "Erfolg", description: "Kontakt wurde aktualisiert" });
    } catch {
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (field: keyof Contact, value: string) => {
    setEditedContact((prev) => ({
      ...prev,
      [field]: value,
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
    navigate,
  };
}
