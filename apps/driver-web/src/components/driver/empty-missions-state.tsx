'use client';

import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { type DriverAvailability } from '@/lib/api/driver';

interface Props {
  availability: DriverAvailability;
}

export function EmptyMissionsState({ availability }: Props) {
  const isOnline = availability === 'AVAILABLE';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-dashed border-white/[0.06] bg-card/50 px-6 py-12 text-center"
    >
      {isOnline ? (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <Wifi className="h-7 w-7 text-primary" />
            </motion.div>
          </div>
          <h3 className="text-base font-bold text-foreground">En attente de missions</h3>
          <p className="mx-auto mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
            Restez en ligne, une nouvelle mission arrivera bientôt
          </p>
        </>
      ) : (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h3 className="text-base font-bold text-foreground">Vous êtes hors ligne</h3>
          <p className="mx-auto mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
            Passez en ligne pour recevoir des missions de livraison
          </p>
        </>
      )}
    </motion.div>
  );
}
