import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import marker icon assets
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default marker icon
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface AddressMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  className?: string;
}

export function AddressMap({ latitude, longitude, address, className = "h-[200px]" }: AddressMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) {
      console.log("Map initialization skipped:", { container: !!mapContainer.current, lat: latitude, lng: longitude });
      return;
    }

    try {
      console.log("Initializing map with coordinates:", { latitude, longitude });

      // Initialize the map if it hasn't been initialized yet
      if (!map.current) {
        map.current = L.map(mapContainer.current).setView([latitude, longitude], 15);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map.current);

        // Add zoom control
        L.control.zoom({ position: 'topright' }).addTo(map.current);
      } else {
        // If map exists, just update the view
        map.current.setView([latitude, longitude], 15);
      }

      // Update or create marker
      if (marker.current) {
        marker.current.setLatLng([latitude, longitude]);
      } else {
        marker.current = L.marker([latitude, longitude]).addTo(map.current);
      }

      // Add popup with address if provided
      if (address) {
        marker.current.bindPopup(address).openPopup();
      }

      console.log("Map initialized successfully");
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("Could not initialize map");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      marker.current = null;
    };
  }, [latitude, longitude, address]);

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
      <div ref={mapContainer} className={`map-container ${className}`} />
    </div>
  );
}
