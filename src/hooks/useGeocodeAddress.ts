
import { useState } from "react";
import { toast } from "sonner";

/** 
 * Hook that geocodes an address to coordinates using OpenStreetMap Nominatim
 */
export function useGeocodeAddress() {
  const [isLoading, setIsLoading] = useState(false);
  
  const geocodeAddress = async (street: string, postal_code: string, city: string, country: string = "Germany") => {
    if (!street || !postal_code || !city) {
      console.log("Incomplete address, returning null coordinates");
      return null;
    }
    
    setIsLoading(true);
    const address = `${street}, ${postal_code} ${city}, ${country}`;
    console.log("Geocoding address:", address);
    
    try {
      // Nominatim API von OpenStreetMap nutzen (kostenlos, kein API-Key erforderlich)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            // User-Agent wird von Nominatim empfohlen
            'User-Agent': 'LovableCRM/1.0'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data?.length) {
        toast.warning("Adresse nicht gefunden", {
          description: "Die eingegebene Adresse konnte nicht gefunden werden."
        });
        return null;
      }

      const { lat, lon } = data[0];
      console.log("Geocoding successful:", { latitude: lat, longitude: lon });
      
      return { 
        longitude: Number(lon), 
        latitude: Number(lat)
      };
    } catch (error: any) {
      console.error("Geocoding error:", error);
      toast.error("Geocoding Error", {
        description: error.message ?? "Could not convert address to coordinates",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geocodeAddress, isLoading };
}
