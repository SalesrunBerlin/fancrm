
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
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const { geocodeAddress, isLoading: isGeocodeLoading } = useGeocodeAddress();

  // Synchronize editedContact when contact is loaded
  useEffect(() => {
    if (contact) {
      // Convert any potential object-wrapped values to simple values
      const processedContact = { ...contact };
      
      // Check if latitude or longitude are objects with _type and value properties
      // This handles the case where they are returned as {_type: "undefined", value: "undefined"}
      if (processedContact.latitude && typeof processedContact.latitude === 'object' && '_type' in (processedContact.latitude as any)) {
        processedContact.latitude = undefined;
      }
      if (processedContact.longitude && typeof processedContact.longitude === 'object' && '_type' in (processedContact.longitude as any)) {
        processedContact.longitude = undefined;
      }
      
      setEditedContact(processedContact);
    }
  }, [contact]);

  // Check if address is complete
  function hasCompleteAddress(data: Partial<Contact>) {
    return Boolean(data.street && data.city && data.postal_code);
  }

  // Automatically geocode address on changes
  const handleAddressBlur = useCallback(async () => {
    if (!editedContact || !hasCompleteAddress(editedContact)) {
      console.log("Address incomplete, skipping geocoding");
      return;
    }
    
    setGeocodingError(null);
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
    } else {
      setGeocodingError("Could not geocode address");
    }
  }, [editedContact, geocodeAddress]);

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
      
      // Make sure we have coordinates if there's a complete address
      let coordinatesToSave: { latitude?: number, longitude?: number } = {};
      let geocodingFailed = false;
      
      if (hasCompleteAddress(editedContact)) {
        if (editedContact.latitude && editedContact.longitude) {
          // Use existing coordinates
          coordinatesToSave = {
            latitude: Number(editedContact.latitude),
            longitude: Number(editedContact.longitude)
          };
          console.log("Using existing coordinates:", coordinatesToSave);
        } else {
          console.log("Getting coordinates before saving");
          // Try to geocode one last time before saving
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
            console.log("Got coordinates before saving:", coordinatesToSave);
          } else {
            geocodingFailed = true;
            console.log("Failed to get coordinates before saving");
          }
        }
      } else {
        // No complete address, clear coordinates
        coordinatesToSave = { latitude: undefined, longitude: undefined };
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
      
      // Update local state with saved data including coordinates
      const updatedContact: Contact = {
        ...contact!,
        ...editedContact,
        latitude: coordinatesToSave.latitude,
        longitude: coordinatesToSave.longitude
      };
      
      setContact(updatedContact);
      setEditedContact(updatedContact);
      
      if (geocodingFailed && hasCompleteAddress(editedContact)) {
        toast({ 
          title: "Contact saved", 
          description: "Contact updated, but geocoding failed. Map display may not work correctly.",
          variant: "default"
        });
      } else {
        toast({ 
          title: "Success", 
          description: "Contact has been updated" 
        });
      }
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
    geocodingError,
  };
}
