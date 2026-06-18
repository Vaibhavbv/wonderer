import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewerProps {
  accessToken: string;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  style?: string;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    label?: string;
    imageUrl?: string;
  }>;
  routeLine?: Array<[number, number]>;
  routeColor?: string;
  onMapClick?: (lng: number, lat: number) => void;
  className?: string;
}

export function MapViewer({
  accessToken,
  center = [135.7681, 35.0116],
  zoom = 12,
  pitch = 0,
  bearing = 0,
  style = 'mapbox://styles/mapbox/streets-v12',
  markers = [],
  routeLine,
  routeColor = '#E85D4C',
  onMapClick,
  className = '',
}: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      pitch,
      bearing,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl());

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat.lng, e.lngLat.lat);
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [accessToken]);

  // Update center/zoom/pitch/bearing when props change
  useEffect(() => {
    if (!map.current) return;
    map.current.easeTo({
      center,
      zoom,
      pitch,
      bearing,
      duration: 1000,
      easing: (t) => t * (2 - t),
    });
  }, [center, zoom, pitch, bearing]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 rounded-full bg-primary-500 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform';
      if (marker.imageUrl) {
        el.style.backgroundImage = `url(${marker.imageUrl})`;
        el.style.backgroundSize = 'cover';
      } else {
        el.innerHTML = '<span class="text-white text-xs font-bold">📍</span>';
      }

      const popup = marker.label
        ? new mapboxgl.Popup({ offset: 25 }).setText(marker.label)
        : undefined;

      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(m);
    });
  }, [markers]);

  // Update route line
  useEffect(() => {
    if (!map.current || !routeLine) return;

    const mapInstance = map.current;

    const updateRoute = () => {
      if (mapInstance.getSource('route')) {
        (mapInstance.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeLine,
          },
        });
      } else {
        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeLine,
            },
          },
        });

        mapInstance.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColor,
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      updateRoute();
    } else {
      mapInstance.on('load', updateRoute);
    }
  }, [routeLine, routeColor]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full rounded-xl overflow-hidden ${className}`}
    />
  );
}
