
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
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) {
      console.log("Map initialization skipped:", { container: !!mapContainer.current, lat: latitude, lng: longitude });
      return;
    }

    try {
      console.log("Initializing map with coordinates:", { latitude, longitude });
      
      mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg';
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude],
        zoom: 15,
      });

      newMap.on('load', () => {
        console.log("Map loaded successfully");
      });

      newMap.on('error', (e) => {
        console.error("Map error:", e);
        setError("Error loading map");
      });

      // Add navigation control
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker
      const newMarker = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([longitude, latitude])
        .addTo(newMap);

      map.current = newMap;
      marker.current = newMarker;

      return () => {
        if (marker.current) {
          marker.current.remove();
        }
        if (map.current) {
          map.current.remove();
        }
      };
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("Could not initialize map");
    }
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">No coordinates available</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
