'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin, Package, Timer, ChevronRight,
  Check, X, Loader2,
} from 'lucide-react';
import { type Delivery, acceptDelivery, rejectDelivery } from '@/lib/api/driver';
import { DeliveryStatusBadge } from './delivery-status-badge';
import { formatCurrency, remainingSeconds } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  delivery: Delivery;
  index?: number;
  onAction?: () => void;
}

export function ActiveMissionCard({ delivery, index = 0, onAction }: Props) {
  const router = useRouter();
  const restaurant = delivery.order.restaurant;
  const address = delivery.order.deliveryAddress;
  const itemCount = delivery.order.items.reduce((s, i) => s + i.quantity, 0);
  const isAssigned = delivery.status === 'ASSIGNED';

  const [countdown, setCountdown] = useState(() =>
    remainingSeconds(delivery.assignmentExpiresAt),
  );
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!isAssigned || countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [isAssigned, countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAccepting(true);
    try {
      await acceptDelivery(delivery.id);
      onAction?.();
    } catch { /* polling refreshes */ } finally { setAccepting(false); }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRejecting(true);
    try {
      await rejectDelivery(delivery.id);
      onAction?.();
    } catch { /* polling refreshes */ } finally { setRejecting(false); }
  };

  const urgency = isAssigned && countdown > 0 && countdown <= 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 28 }}
      className={cn(
        'overflow-hidden rounded-3xl border bg-card transition-all',
        isAssigned
          ? urgency
            ? 'border-red-500/30 shadow-[0_0_30px_-8px_rgba(239,68,68,0.15)]'
            : 'border-amber-500/25 shadow-[0_0_30px_-8px_rgba(245,158,11,0.1)]'
          : 'border-white/[0.06]',
      )}
    >
      {/* Timer progress bar */}
      {isAssigned && countdown > 0 && (
        <div className="h-1 bg-white/[0.04]">
          <motion.div
            className={cn('h-full rounded-r-full', urgency ? 'bg-red-500' : 'bg-amber-500')}
            initial={{ width: '100%' }}
            animate={{ width: `${(countdown / 120) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      )}

      <button
        onClick={() => router.push(`/driver/deliveries/${delivery.id}`)}
        className="w-full p-4 text-left"
      >
        {/* Badge + timer + fee */}
        <div className="mb-3 flex items-center justify-between">
          <DeliveryStatusBadge status={delivery.status} />
          <div className="flex items-center gap-2">
            {isAssigned && countdown > 0 && (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums',
                  urgency ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400',
                )}
              >
                <Timer className="h-3 w-3" />
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {formatCurrency(delivery.deliveryFee)}
            </span>
          </div>
        </div>

        {/* Route: restaurant → client */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">{restaurant.name}</div>
              {restaurant.street && (
                <div className="truncate text-xs text-muted-foreground">{restaurant.street}</div>
              )}
            </div>
          </div>

          <div className="ml-[15px] h-3 w-0.5 bg-white/[0.08]" />

          {address ? (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <MapPin className="h-4 w-4 text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{address.label || 'Client'}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {address.street}, {address.city}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">Adresse à confirmer</div>
            </div>
          )}
        </div>

        {/* Items + arrow */}
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </button>

      {/* Inline actions for ASSIGNED */}
      {isAssigned && (
        <div className="flex gap-2.5 border-t border-white/[0.06] px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReject}
            disabled={rejecting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-semibold text-red-400 transition-colors"
          >
            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Refuser
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAccept}
            disabled={accepting}
            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Accepter
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
