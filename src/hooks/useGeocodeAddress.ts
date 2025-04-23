
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

/** 
 * Hook that geocodes an address to coordinates using Mapbox
 */
export function useGeocodeAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const geocodeAddress = async (street: string, postal_code: string, city: string, country: string = "Germany") => {
    setIsLoading(true);
    const address = `${street}, ${postal_code} ${city}, ${country}`;
    console.log("Geocoding address:", address);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg`
      );
      if (!response.ok) throw new Error("Geocoding request failed");
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        console.log("Geocoding successful:", { latitude, longitude });
        return { longitude: Number(longitude), latitude: Number(latitude) };
      } else {
        console.log("No geocoding results found");
        throw new Error("No location data found");
      }
    } catch (error: any) {
      console.error("Geocoding error:", error);
      toast({
        title: "Geocoding Error",
        description: error.message ?? "Could not convert address to coordinates",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geocodeAddress, isLoading };
}
