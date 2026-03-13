'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Loader2 } from 'lucide-react';
import { type DriverAvailability, setAvailability } from '@/lib/api/driver';
import { cn } from '@/lib/cn';

interface Props {
  availability: DriverAvailability;
  onChanged: (a: DriverAvailability) => void;
}

export function DriverOnlineCard({ availability, onChanged }: Props) {
  const [loading, setLoading] = useState(false);

  const isOnline = availability === 'AVAILABLE' || availability === 'BUSY';
  const isBusy = availability === 'BUSY';

  const toggle = async () => {
    if (isBusy || loading) return;
    setLoading(true);
    try {
      const target = isOnline ? 'OFFLINE' : 'AVAILABLE';
      const result = await setAvailability(target);
      onChanged(result.availability);
    } catch {
      // keep current
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={toggle}
      disabled={isBusy || loading}
      className={cn(
        'relative w-full overflow-hidden rounded-3xl p-5 text-left transition-all',
        isOnline
          ? 'bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20'
          : 'bg-card border border-white/[0.06]',
        isBusy && 'cursor-not-allowed',
      )}
      whileTap={!isBusy ? { scale: 0.98 } : undefined}
    >
      {isOnline && !isBusy && (
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/15 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3.5 }}
        />
      )}

      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
            isBusy
              ? 'bg-amber-500/15'
              : isOnline
                ? 'bg-primary/15'
                : 'bg-muted',
          )}
        >
          {loading ? (
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          ) : (
            <Power
              className={cn(
                'h-7 w-7',
                isBusy ? 'text-amber-500' : isOnline ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'text-lg font-bold',
              isBusy ? 'text-amber-500' : isOnline ? 'text-primary' : 'text-foreground',
            )}
          >
            {isBusy ? 'En course' : isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          <div className="text-sm text-muted-foreground">
            {isBusy
              ? 'Livraison en cours'
              : isOnline
                ? 'Prêt à recevoir des missions'
                : 'Appuyez pour passer en ligne'}
          </div>
        </div>

        <div className="shrink-0">
          {isOnline && !isBusy ? (
            <div className="relative">
              <div className="h-4 w-4 rounded-full bg-primary" />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary"
                animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>
          ) : isBusy ? (
            <div className="h-4 w-4 rounded-full bg-amber-500" />
          ) : (
            <div className="h-4 w-4 rounded-full bg-white/[0.08]" />
          )}
        </div>
      </div>
    </motion.button>
  );
}
