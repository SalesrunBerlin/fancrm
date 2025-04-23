
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Contact } from "@/lib/types/database";
import { useFetchContactRelations } from "./useFetchContactRelations";
import { supabase } from "@/integrations/supabase/client";
import { useGeocodeAddress } from "./useGeocodeAddress";

/**
 * Main hook for managing contact details including editing, deleting, and saving logic
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

  // Synchronize editedContact when contact is loaded
  useEffect(() => {
    if (contact) {
      setEditedContact(contact);
    }
  }, [contact]);

  // Check if address is complete
  function hasCompleteAddress(data: Partial<Contact>) {
    return !!data.street && !!data.city && !!data.postal_code;
  }

  // Automatically geocode address on changes
  const handleAddressBlur = useCallback(async () => {
    if (!editedContact || !hasCompleteAddress(editedContact)) {
      console.log("Address incomplete, skipping geocoding");
      return;
    }
    
    console.log("Address complete, getting coordinates");
    // Get geocode and update coordinates
    const coords = await geocodeAddress(
      editedContact.street!,
      editedContact.postal_code!,
      editedContact.city!,
      editedContact.country || "Germany"
    );
    
    if (coords) {
      console.log("Updating coordinates:", coords);
      setEditedContact((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
    }
  }, [editedContact.street, editedContact.postal_code, editedContact.city, editedContact.country, geocodeAddress]);

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
      console.log("Saving contact with data:", editedContact);
      
      let coordinatesToSave = {
        latitude: editedContact.latitude,
        longitude: editedContact.longitude
      };
      
      // Make sure we have coordinates if there's a complete address
      if (hasCompleteAddress(editedContact) && (!editedContact.latitude || !editedContact.longitude)) {
        console.log("Getting coordinates before saving");
        const coords = await geocodeAddress(
          editedContact.street!,
          editedContact.postal_code!,
          editedContact.city!,
          editedContact.country || "Germany"
        );
        
        if (coords) {
          coordinatesToSave = {
            latitude: coords.latitude,
            longitude: coords.longitude
          };
        }
      }
      
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
        latitude: coordinatesToSave.latitude,
        longitude: coordinatesToSave.longitude,
      };
      
      console.log("Updating contact with:", updateData);
      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      
      const updatedContact: Contact = {
        ...contact!,
        ...editedContact,
        latitude: coordinatesToSave.latitude,
        longitude: coordinatesToSave.longitude
      };
      
      setContact(updatedContact);
      toast({ title: "Success", description: "Contact has been updated" });
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Contact could not be updated",
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (field: keyof Contact, value: string) => {
    setEditedContact((prev) => ({
      ...prev,
      [field]: value,
      // Clear existing coordinates when address fields change
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
