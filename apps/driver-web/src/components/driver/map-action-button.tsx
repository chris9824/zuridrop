'use client';

import { Navigation } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  label: string;
  lat?: number | null;
  lng?: number | null;
  address?: string;
  className?: string;
}

export function MapActionButton({ label, lat, lng, address, className }: Props) {
  const handleOpen = () => {
    let url: string;
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else if (address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    } else {
      return;
    }
    window.open(url, '_blank');
  };

  if (!lat && !lng && !address) return null;

  return (
    <button
      onClick={handleOpen}
      className={cn(
        'flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-500/20',
        className,
      )}
    >
      <Navigation className="h-4 w-4" />
      {label}
    </button>
  );
}
