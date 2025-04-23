
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/lib/types/database";

/**
 * Prüft, ob Geocoding benötigt wird (vollständige Adresse, aber fehlende Koordinaten)
 */
export const shouldGeocodeAddress = (contact: Contact): boolean => {
  const hasCompleteAddress =
    !!contact.street && !!contact.city && !!contact.postal_code && !!contact.country;
  const hasMissingCoordinates = !contact.latitude || !contact.longitude;
  return hasCompleteAddress && hasMissingCoordinates;
};

/**
 * Geokodiert die Adresse und speichert Längen- und Breitengrad in Supabase
 */
export async function geocodeAndUpdateContact(contact: Contact, setContact?: (c: Contact) => void, setEditedContact?: (c: Partial<Contact>) => void) {
  if (!shouldGeocodeAddress(contact)) return;

  const address = `${contact.street}, ${contact.postal_code} ${contact.city}, ${contact.country}`;
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg`
    );
    if (!response.ok) return;

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      await supabase
        .from("contacts")
        .update({ latitude, longitude })
        .eq("id", contact.id);

      if (setContact) setContact({ ...contact, latitude, longitude });
      if (setEditedContact) setEditedContact({ ...setEditedContact, latitude, longitude });
    }
  } catch (err) {
    // Fehler können in der aufrufenden Komponente geloggt werden
  }
}
