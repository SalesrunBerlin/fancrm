
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

/** 
 * Hook that geocodes an address to coordinates using Mapbox
 */
export function useGeocodeAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const getMapboxToken = () => {
    return "pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg";
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
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
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
