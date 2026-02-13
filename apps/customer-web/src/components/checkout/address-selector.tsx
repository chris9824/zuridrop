'use client';

import { MapPin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApiAddress } from '@/lib/api/schemas';

interface AddressSelectorProps {
  addresses: ApiAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function AddressSelector({ addresses, selectedId, onSelect, loading, error }: AddressSelectorProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (addresses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">Aucune adresse enregistrée</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajoutez une adresse de livraison dans votre profil.
        </p>
        <button className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" />
          Ajouter une adresse
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {addresses.map((addr) => (
        <button
          key={addr.id}
          onClick={() => onSelect(addr.id)}
          className={cn(
            'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
            selectedId === addr.id
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border bg-card hover:bg-accent',
          )}
        >
          <MapPin className={cn('mt-0.5 h-4 w-4 shrink-0', selectedId === addr.id ? 'text-primary' : 'text-muted-foreground')} />
          <div className="flex-1">
            {addr.label && (
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {addr.label}
              </span>
            )}
            <p className="text-sm font-medium text-foreground">{addr.street}</p>
            <p className="text-xs text-muted-foreground">
              {[addr.city, addr.zipCode, addr.country].filter(Boolean).join(', ')}
            </p>
          </div>
          {selectedId === addr.id && (
            <span className="mt-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
