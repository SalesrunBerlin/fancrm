
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Contact } from "@/lib/types/database";
import { useFetchContactRelations } from "./useFetchContactRelations";
import { supabase } from "@/integrations/supabase/client";
import { useGeocodeAddress } from "./useGeocodeAddress";

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
  const { geocodeAddress, isLoading: isGeocodeLoading } = useGeocodeAddress();

  // Synchronisiere editedContact, wenn Kontakt geladen
  useEffect(() => {
    if (contact) {
      setEditedContact(contact);
    }
  }, [contact]);

  // Prüft, ob Adresse vollständig ist
  function hasCompleteAddress(data: Partial<Contact>) {
    return !!data.street && !!data.city && !!data.postal_code && !!data.country;
  }

  // Automatisch bei Adressänderungen Geocoding ausführen
  const handleAddressBlur = useCallback(async () => {
    if (!editedContact || !hasCompleteAddress(editedContact)) return;
    // bereits Koordinaten vorhanden?
    if (editedContact.latitude && editedContact.longitude) return;
    // Geocode holen und Koordinaten setzen
    const coords = await geocodeAddress(
      editedContact.street!,
      editedContact.postal_code!,
      editedContact.city!,
      editedContact.country || "Germany"
    );
    if (coords) {
      setEditedContact((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedContact.street, editedContact.postal_code, editedContact.city, editedContact.country]);

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
        latitude: editedContact.latitude,
        longitude: editedContact.longitude,
      };
      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      const updatedContact = { ...contact!, ...editedContact };
      setContact(updatedContact as Contact);

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
      // Wenn Adressfeld geändert wird, lösche bestehende Koordinaten
      ...(field === "street" || field === "city" || field === "postal_code" || field === "country"
        ? { latitude: undefined, longitude: undefined }
        : {}
      ),
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
    handleAddressBlur,
    isAddressLoading: isGeocodeLoading,
    navigate,
  };
}
