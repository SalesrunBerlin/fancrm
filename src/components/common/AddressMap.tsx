
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';

interface AddressMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  className?: string;
}

export function AddressMap({ latitude, longitude, address, className = "h-[200px]" }: AddressMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const { toast } = useToast();
  const [mapCoordinates, setMapCoordinates] = useState<[number, number] | null>(
    latitude && longitude ? [longitude, latitude] : null
  );

  // Get Mapbox token - using the same method as in useGeocodeAddress for consistency
  const getMapboxToken = () => {
    return "pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg";
  };

  // Geocode address if no coordinates are provided
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address || (latitude && longitude)) return;
      
      try {
        const mapboxToken = getMapboxToken();
        if (!mapboxToken) {
          console.error("No Mapbox token provided for map");
          return;
        }

        console.log("Geocoding address for map display:", address);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
        );

        if (!response.ok) {
          console.error(`Geocoding API error: ${response.status}`);
          throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          setMapCoordinates([longitude, latitude]);
          console.log("Map geocoding successful:", { latitude, longitude });
        } else {
          console.log("No map geocoding results found");
        }
      } catch (err) {
        console.error('Error geocoding address:', err);
      }
    };

    geocodeAddress();
  }, [address, latitude, longitude]);

  // Update map coordinates when latitude/longitude props change
  useEffect(() => {
    if (latitude && longitude) {
      setMapCoordinates([Number(longitude), Number(latitude)]);
    }
  }, [latitude, longitude]);

  // Create and update map
  useEffect(() => {
    if (!mapContainer.current || !mapCoordinates) return;

    const token = getMapboxToken();
    if (!token) {
      console.error("No Mapbox token available for map");
      return;
    }

    mapboxgl.accessToken = token;

    if (!map.current) {
      console.log("Creating new map with coordinates:", mapCoordinates);
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: mapCoordinates,
          zoom: 15
        });

        // Add controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        setMapInitialized(true);
      } catch (err) {
        console.error("Error creating map:", err);
      }
    } else {
      // Update map center when coordinates change
      console.log("Updating map center to:", mapCoordinates);
      try {
        map.current.flyTo({
          center: mapCoordinates,
          zoom: 15,
          essential: true
        });
      } catch (err) {
        console.error("Error updating map center:", err);
      }
    }

    // Add/update marker
    if (mapInitialized && map.current) {
      try {
        // Remove existing markers
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Add new marker
        new mapboxgl.Marker()
          .setLngLat(mapCoordinates)
          .addTo(map.current);
      } catch (err) {
        console.error("Error adding marker to map:", err);
      }
    }

    return () => {
      // Cleanup only when component unmounts
      if (map.current && mapContainer.current === null) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapCoordinates, mapInitialized]);

  if (!latitude && !longitude && !address) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">No address data available</p>
      </div>
    );
  }

  if (!mapCoordinates) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
