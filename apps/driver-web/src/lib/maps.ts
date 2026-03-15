export interface NavigationTarget {
  lat?: number | null;
  lng?: number | null;
  address?: string;
}

export function buildGoogleMapsUrl(target: NavigationTarget): string | null {
  if (target.lat && target.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`;
  }
  if (target.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target.address)}`;
  }
  return null;
}

export function buildRestaurantNavigationUrl(restaurant: {
  latitude?: number;
  longitude?: number;
  street?: string;
  city?: string;
}): string | null {
  return buildGoogleMapsUrl({
    lat: restaurant.latitude,
    lng: restaurant.longitude,
    address: [restaurant.street, restaurant.city].filter(Boolean).join(', ') || undefined,
  });
}

export function buildCustomerNavigationUrl(address?: {
  latitude?: number;
  longitude?: number;
  street?: string;
  city?: string;
} | null): string | null {
  if (!address) return null;
  return buildGoogleMapsUrl({
    lat: address.latitude,
    lng: address.longitude,
    address: [address.street, address.city].filter(Boolean).join(', ') || undefined,
  });
}

export function openGoogleMaps(target: NavigationTarget): boolean {
  const url = buildGoogleMapsUrl(target);
  if (!url) return false;
  window.open(url, '_blank');
  return true;
}
