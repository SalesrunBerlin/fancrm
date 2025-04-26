
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
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);

  // Update map coordinates when props change
  useEffect(() => {
    if (latitude && longitude) {
      setMapCoordinates([longitude, latitude]);
      console.log("Map coordinates updated:", { latitude, longitude });
    }
  }, [latitude, longitude]);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || !mapCoordinates || map.current) return;

    console.log("Creating new map with coordinates:", mapCoordinates);
    
    // Configuration for OpenStreetMap as tile layer
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg';
    
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: mapCoordinates,
      zoom: 15
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Set the map reference
    map.current = mapInstance;
    
    // Create marker when map is loaded
    mapInstance.on('load', () => {
      console.log("Map loaded successfully");
      setMapInitialized(true);
      
      // Add marker after map is loaded
      if (mapCoordinates) {
        const newMarker = new mapboxgl.Marker()
          .setLngLat(mapCoordinates)
          .addTo(mapInstance);
        setMarker(newMarker);
      }
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up map");
      if (marker) {
        marker.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapCoordinates]); // Only initialize map when coordinates change or on first render

  // Update marker and map center when coordinates change (but map already exists)
  useEffect(() => {
    if (!mapCoordinates || !map.current || !mapInitialized) return;

    console.log("Updating map center to:", mapCoordinates);
    
    // Update map center with animation
    map.current.flyTo({
      center: mapCoordinates,
      zoom: 15,
      essential: true
    });

    // Update marker position
    if (marker) {
      marker.setLngLat(mapCoordinates);
    } else if (map.current) {
      // Create new marker if it doesn't exist
      const newMarker = new mapboxgl.Marker()
        .setLngLat(mapCoordinates)
        .addTo(map.current);
      setMarker(newMarker);
    }
  }, [mapCoordinates, mapInitialized, marker]);

  if (!latitude && !longitude && !address) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">No address data available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className} relative z-30`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
