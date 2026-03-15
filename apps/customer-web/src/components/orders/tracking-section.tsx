'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Truck, CheckCircle2, Loader2 } from 'lucide-react';
import { getOrderTracking, type TrackingData } from '@/lib/api/orders';

const LiveTrackingMap = dynamic(
  () => import('./live-tracking-map').then((m) => ({ default: m.LiveTrackingMap })),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-border bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const TRACKING_POLL_MS = 4_000;

const STATUS_CONFIG: Record<TrackingData['status'], { label: string; icon: typeof Truck; color: string }> = {
  WAITING: { label: 'En attente du départ…', icon: Navigation, color: 'text-muted-foreground' },
  EN_ROUTE: { label: 'Le livreur est en route', icon: Truck, color: 'text-indigo-500 dark:text-indigo-400' },
  APPROACHING: { label: 'Le livreur approche !', icon: MapPin, color: 'text-primary' },
  ARRIVED: { label: 'Le livreur est arrivé', icon: CheckCircle2, color: 'text-green-500' },
};

interface Props {
  orderId: string;
  orderStatus: string;
}

export function TrackingSection({ orderId, orderStatus }: Props) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTrackable = orderStatus === 'IN_TRANSIT' || orderStatus === 'PICKED_UP';
  const isDelivered = orderStatus === 'DELIVERED';

  const fetchTracking = useCallback(async () => {
    const data = await getOrderTracking(orderId);
    if (data) setTracking(data);
  }, [orderId]);

  useEffect(() => {
    if (!isTrackable && !isDelivered) return;
    fetchTracking();
  }, [isTrackable, isDelivered, fetchTracking]);

  useEffect(() => {
    if (!isTrackable) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (!document.hidden) fetchTracking();
    }, TRACKING_POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTrackable, fetchTracking]);

  if (!tracking || (!tracking.restaurant && !tracking.driver)) return null;

  const cfg = STATUS_CONFIG[tracking.status] ?? STATUS_CONFIG.WAITING;
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="space-y-3"
    >
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Navigation className="h-4 w-4 text-primary" />
            Suivi en direct
          </h2>
          {isTrackable && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              En direct
            </span>
          )}
        </div>

        <LiveTrackingMap
          restaurant={tracking.restaurant}
          customer={tracking.customer}
          driver={tracking.driver}
        />

        {/* Status + distance */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
            <span className={`text-sm font-semibold ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>

          {tracking.distanceRemainingKm != null && tracking.status !== 'ARRIVED' && (
            <div className="text-right">
              <div className="text-lg font-bold text-foreground tabular-nums">
                {tracking.distanceRemainingKm < 1
                  ? `${Math.round(tracking.distanceRemainingKm * 1000)} m`
                  : `${tracking.distanceRemainingKm} km`}
              </div>
              <div className="text-[11px] text-muted-foreground">restant</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {tracking.percentProgress > 0 && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${tracking.percentProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
