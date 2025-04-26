
import { useState } from "react";
import { toast } from "sonner";

/** 
 * Hook that geocodes an address to coordinates using Mapbox
 */
export function useGeocodeAddress() {
  const [isLoading, setIsLoading] = useState(false);
  
  const getMapboxToken = () => {
    // This is a valid public Mapbox token with access to geocoding API
    return "pk.eyJ1IjoibG92YWJsZWFwcCIsImEiOiJjbHY5cjI3cDUwMnVzMnRvZHp6dng4bjQxIn0.a-KUJUuggl3Dy3DZBR_xPQ";
  };

  const geocodeAddress = async (street: string, postal_code: string, city: string, country: string = "Germany") => {
    if (!street || !postal_code || !city) {
      console.log("Incomplete address, returning null coordinates");
      return null;
    }
    
    setIsLoading(true);
    const address = `${street}, ${postal_code} ${city}, ${country}`;
    console.log("Geocoding address:", address);
    
    try {
      const mapboxToken = getMapboxToken();
      if (!mapboxToken) {
        throw new Error("Missing API key for map service");
      }
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
      );
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.features?.length) {
        throw new Error("No coordinates found for this address");
      }

      const [longitude, latitude] = data.features[0].center;
      console.log("Geocoding successful:", { latitude, longitude });
      
      return { 
        longitude: Number(longitude), 
        latitude: Number(latitude) 
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
