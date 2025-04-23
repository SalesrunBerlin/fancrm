
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

/** 
 * Hook that geocodes an address to coordinates using Mapbox
 */
export function useGeocodeAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // This is a temporary function until proper API key management is set up
  // In production, this should be managed through environment variables or secure storage
  const getMapboxToken = () => {
    // Replace with your valid Mapbox token
    return "pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg";
  };

  const geocodeAddress = async (street: string, postal_code: string, city: string, country: string = "Germany") => {
    if (!street || !postal_code || !city) {
      console.log("Incomplete address, skipping geocoding");
      return null;
    }
    
    setIsLoading(true);
    const address = `${street}, ${postal_code} ${city}, ${country}`;
    console.log("Geocoding address:", address);
    
    try {
      const mapboxToken = getMapboxToken();
      if (!mapboxToken) {
        console.error("No Mapbox token provided");
        toast({
          title: "Geocoding Error",
          description: "Missing API key for map service",
          variant: "destructive"
        });
        return null;
      }
      
      console.log("Using Mapbox token:", mapboxToken ? "Token provided" : "No token");
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
      );
      
      if (!response.ok) {
        const statusText = response.statusText;
        const status = response.status;
        console.error(`Geocoding request failed with status ${status}: ${statusText}`);
        throw new Error(`Geocoding request failed: ${status} ${statusText}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        console.log("Geocoding successful:", { latitude, longitude });
        return { 
          longitude: Number(longitude), 
          latitude: Number(latitude) 
        };
      } else {
        console.log("No geocoding results found");
        toast({
          title: "Address not found",
          description: "Could not locate this address on the map",
          variant: "destructive"  // Changed from "warning" to "destructive" to fix the TS error
        });
        return null;
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
