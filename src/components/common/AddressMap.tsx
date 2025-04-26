
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const [mapCoordinates, setMapCoordinates] = useState<[number, number] | null>(
    latitude && longitude ? [longitude, latitude] : null
  );

  const getMapboxToken = () => {
    return "pk.eyJ1IjoibG92YWJsZWFwcCIsImEiOiJjbHY5cjI3cDUwMnVzMnRvZHp6dng4bjQxIn0.a-KUJUuggl3Dy3DZBR_xPQ";
  };

  // Update map coordinates when props change
  useEffect(() => {
    if (latitude && longitude) {
      setMapCoordinates([longitude, latitude]);
      console.log("Map coordinates updated:", { latitude, longitude });
    }
  }, [latitude, longitude]);

  // Initialize and update map
  useEffect(() => {
    if (!mapContainer.current || !mapCoordinates) return;

    const token = getMapboxToken();
    if (!token) {
      console.error("No Mapbox token available");
      return;
    }

    mapboxgl.accessToken = token;

    if (!map.current) {
      console.log("Creating new map with coordinates:", mapCoordinates);
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: mapCoordinates,
        zoom: 15
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      setMapInitialized(true);
    } else if (mapInitialized) {
      console.log("Updating map center to:", mapCoordinates);
      map.current.flyTo({
        center: mapCoordinates,
        zoom: 15,
        essential: true
      });
    }

    // Update marker
    if (mapInitialized && map.current) {
      // Remove existing markers
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach(marker => marker.remove());
      
      // Add new marker
      new mapboxgl.Marker()
        .setLngLat(mapCoordinates)
        .addTo(map.current);
    }

    return () => {
      if (map.current && !mapContainer.current) {
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

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
