'use client';

import { Navigation } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buildGoogleMapsUrl } from '@/lib/maps';
import { useToast } from './toast';

interface Props {
  label: string;
  lat?: number | null;
  lng?: number | null;
  address?: string;
  className?: string;
  disabled?: boolean;
}

export function MapActionButton({ label, lat, lng, address, className, disabled }: Props) {
  const { toast } = useToast();

  const url = buildGoogleMapsUrl({ lat, lng, address });

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url) {
      toast('error', 'Adresse non disponible');
      return;
    }
    window.open(url, '_blank');
  };

  if (!url && !disabled) return null;

  return (
    <button
      onClick={handleOpen}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-500/20',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <Navigation className="h-4 w-4" />
      {label}
    </button>
  );
}
