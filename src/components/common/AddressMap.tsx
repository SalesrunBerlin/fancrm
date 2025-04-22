
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

  // Geokodieren einer Adresse, wenn keine Koordinaten übergeben wurden
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address || (latitude && longitude)) return;
      
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg`
        );

        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          setMapCoordinates([longitude, latitude]);
        }
      } catch (err) {
        console.error('Error geocoding address:', err);
      }
    };

    geocodeAddress();
  }, [address, latitude, longitude]);

  // Erstellen und Aktualisieren der Karte
  useEffect(() => {
    if (!mapContainer.current || !mapCoordinates) return;

    mapboxgl.accessToken = "pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg";

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: mapCoordinates,
        zoom: 15
      });

      // Hinzufügen von Steuerungselementen
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      setMapInitialized(true);
    } else {
      // Aktualisieren des Kartenzentrums, wenn sich die Koordinaten ändern
      map.current.flyTo({
        center: mapCoordinates,
        zoom: 15,
        essential: true
      });
    }

    // Marker auf der Karte hinzufügen/aktualisieren
    if (mapInitialized) {
      // Bestehende Marker entfernen
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach(marker => marker.remove());
      
      // Neuen Marker hinzufügen
      new mapboxgl.Marker()
        .setLngLat(mapCoordinates)
        .addTo(map.current);
    }

    return () => {
      // Cleanup nur durchführen, wenn die Komponente unmontiert wird
      if (map.current && mapContainer.current === null) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapCoordinates, mapInitialized]);

  if (!latitude && !longitude && !address) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">Keine Adressdaten verfügbar</p>
      </div>
    );
  }

  if (!mapCoordinates) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">Karte wird geladen...</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
