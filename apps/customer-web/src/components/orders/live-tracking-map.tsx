'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Coords {
  lat: number;
  lng: number;
}

interface Props {
  restaurant: Coords | null;
  customer: Coords | null;
  driver: Coords | null;
}

const RESTAURANT_ICON = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%2316a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const CUSTOMER_ICON = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23f97316" stroke="%23f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="white"/></svg>`),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const DRIVER_ICON = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r="19" fill="%234f46e5" stroke="white" stroke-width="2.5"/><g transform="translate(9,12)" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12h22"/><path d="M3 12V7a1 1 0 0 1 1-1h7l3 4h4a2 2 0 0 1 2 2v0"/><circle cx="6.5" cy="12" r="2" fill="white"/><circle cx="17.5" cy="12" r="2" fill="white"/></g></svg>`),
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

function FitBounds({ points }: { points: Coords[] }) {
  const map = useMap();
  const prevBoundsRef = useRef<string>('');

  useEffect(() => {
    if (points.length < 2) return;
    const boundsKey = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
    if (boundsKey === prevBoundsRef.current) return;
    prevBoundsRef.current = boundsKey;

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);

  return null;
}

function SmoothDriverMarker({ position }: { position: Coords }) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
    }
  }, [position]);

  return (
    <Marker ref={markerRef} position={[position.lat, position.lng]} icon={DRIVER_ICON}>
      <Popup>Votre livreur</Popup>
    </Marker>
  );
}

export default function LiveTrackingMap({ restaurant, customer, driver }: Props) {
  const allPoints = useMemo(() => {
    const pts: Coords[] = [];
    if (restaurant) pts.push(restaurant);
    if (customer) pts.push(customer);
    if (driver) pts.push(driver);
    return pts;
  }, [restaurant, customer, driver]);

  const center = useMemo(() => {
    if (driver) return { lat: driver.lat, lng: driver.lng };
    if (restaurant) return { lat: restaurant.lat, lng: restaurant.lng };
    return { lat: 5.36, lng: -3.94 };
  }, [driver, restaurant]);

  const routeLine = useMemo(() => {
    if (!restaurant || !customer) return [];
    const pts: [number, number][] = [[restaurant.lat, restaurant.lng]];
    if (driver) pts.push([driver.lat, driver.lng]);
    pts.push([customer.lat, customer.lng]);
    return pts;
  }, [restaurant, customer, driver]);

  return (
    <div className="zd-live-map h-[280px] w-full overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={allPoints} />

        {routeLine.length >= 2 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#6366f1', weight: 3, opacity: 0.6, dashArray: '8 6' }}
          />
        )}

        {restaurant && (
          <Marker position={[restaurant.lat, restaurant.lng]} icon={RESTAURANT_ICON}>
            <Popup>Restaurant</Popup>
          </Marker>
        )}

        {customer && (
          <Marker position={[customer.lat, customer.lng]} icon={CUSTOMER_ICON}>
            <Popup>Adresse de livraison</Popup>
          </Marker>
        )}

        {driver && <SmoothDriverMarker position={driver} />}
      </MapContainer>
    </div>
  );
}
