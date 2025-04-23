
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

/** 
 * Hook, der eine Adresse in Geokoordinaten umwandelt (Mapbox) 
 */
export function useGeocodeAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const geocodeAddress = async (street: string, postal_code: string, city: string, country: string = "Germany") => {
    setIsLoading(true);
    const address = `${street}, ${postal_code} ${city}, ${country}`;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg`
      );
      if (!response.ok) throw new Error("Geocoding Anfrage fehlgeschlagen");
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        return { longitude, latitude };
      } else {
        throw new Error("Keine Geodaten gefunden");
      }
    } catch (error: any) {
      toast({
        title: "Geocoding Fehler",
        description: error.message ?? "Adresse konnte nicht umgewandelt werden",
        variant: "destructive"
      });
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  return { geocodeAddress, isLoading };
}
