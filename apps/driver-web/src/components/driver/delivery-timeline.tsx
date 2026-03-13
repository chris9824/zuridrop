'use client';

import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { type Delivery, type DeliveryStatus } from '@/lib/api/driver';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

const STEPS: { status: DeliveryStatus; label: string }[] = [
  { status: 'ASSIGNED', label: 'Assignée' },
  { status: 'ACCEPTED', label: 'Acceptée' },
  { status: 'PICKED_UP', label: 'Récupérée' },
  { status: 'IN_TRANSIT', label: 'En route' },
  { status: 'DELIVERED', label: 'Livrée' },
];

const STATUS_ORDER: Record<string, number> = {
  ASSIGNED: 0, ACCEPTED: 1, PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4,
};

function getTimestamp(delivery: Delivery, status: DeliveryStatus): string | null | undefined {
  const map: Record<string, string | null | undefined> = {
    ASSIGNED: delivery.assignedAt,
    ACCEPTED: delivery.acceptedAt,
    PICKED_UP: delivery.pickedUpAt,
    IN_TRANSIT: delivery.startedAt,
    DELIVERED: delivery.deliveredAt,
  };
  return map[status];
}

interface Props {
  delivery: Delivery;
}

export function DeliveryTimeline({ delivery }: Props) {
  const currentIdx = STATUS_ORDER[delivery.status] ?? -1;
  const isCancelled = delivery.status === 'CANCELLED' || delivery.status === 'REJECTED' || delivery.status === 'EXPIRED';

  if (isCancelled) {
    const labels: Record<string, string> = {
      CANCELLED: 'Livraison annulée',
      REJECTED: 'Livraison refusée',
      EXPIRED: 'Assignation expirée',
    };
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
        <span className="text-sm font-semibold text-red-400">{labels[delivery.status]}</span>
      </div>
    );
  }

  return (
    <div>
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const ts = getTimestamp(delivery, step.status);

        return (
          <motion.div
            key={step.status}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  isDone && 'border-primary bg-primary',
                  isCurrent && 'border-primary bg-primary/15',
                  !isDone && !isCurrent && 'border-white/[0.08] bg-transparent',
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                ) : (
                  <Circle
                    className={cn(
                      'h-2.5 w-2.5',
                      isCurrent ? 'fill-primary text-primary' : 'text-white/[0.1]',
                    )}
                  />
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[24px]',
                    isDone ? 'bg-primary' : 'bg-white/[0.06]',
                  )}
                />
              )}
            </div>
            <div className={cn('pb-4', idx === STEPS.length - 1 && 'pb-0')}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground/50',
                  )}
                >
                  {step.label}
                </span>
                {ts && (isDone || isCurrent) && (
                  <span className="text-[11px] text-muted-foreground">{formatTime(ts)}</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
