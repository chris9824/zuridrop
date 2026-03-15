'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin, Package, Timer, ChevronRight, User, Navigation,
  Check, X, Loader2, Truck, Flag, MessageSquare,
} from 'lucide-react';
import {
  type Delivery,
  acceptDelivery,
  rejectDelivery,
  pickupDelivery,
  startDelivery,
  completeDelivery,
} from '@/lib/api/driver';
import { buildRestaurantNavigationUrl, buildCustomerNavigationUrl } from '@/lib/maps';
import { DeliveryStatusBadge } from './delivery-status-badge';
import { formatCurrency, remainingSeconds } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  delivery: Delivery;
  index?: number;
  onAction?: () => void;
}

const STATUS_INSTRUCTION: Record<string, string> = {
  ASSIGNED: 'Nouvelle mission disponible',
  ACCEPTED: 'Rendez-vous au restaurant',
  PICKED_UP: 'Commande récupérée — démarrez',
  IN_TRANSIT: 'En route vers le client',
};

function NavShortcut({ delivery }: { delivery: Delivery }) {
  const status = delivery.status;
  const restaurant = delivery.order.restaurant;
  const address = delivery.order.deliveryAddress;

  const toRestaurant = status === 'ACCEPTED';
  const toClient = status === 'PICKED_UP' || status === 'IN_TRANSIT';

  if (!toRestaurant && !toClient) return null;

  const url = toRestaurant
    ? buildRestaurantNavigationUrl(restaurant)
    : buildCustomerNavigationUrl(address);

  if (!url) return null;

  const handleNav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const label = toRestaurant ? 'Vers le restaurant' : 'Vers le client';
  const accent = toRestaurant
    ? 'text-blue-400 bg-blue-500/[0.06] hover:bg-blue-500/10 border-blue-500/15'
    : 'text-orange-400 bg-orange-500/[0.06] hover:bg-orange-500/10 border-orange-500/15';

  return (
    <div className="border-t border-white/[0.06] px-4 py-2">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleNav}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-semibold transition-colors',
          accent,
        )}
      >
        <Navigation className="h-3.5 w-3.5" />
        {label}
      </motion.button>
    </div>
  );
}

export function ActiveMissionCard({ delivery, index = 0, onAction }: Props) {
  const router = useRouter();
  const restaurant = delivery.order.restaurant;
  const address = delivery.order.deliveryAddress;
  const customer = delivery.order.customer;
  const itemCount = delivery.order.items.reduce((s, i) => s + i.quantity, 0);
  const isAssigned = delivery.status === 'ASSIGNED';
  const notes = delivery.order.notes;

  const [countdown, setCountdown] = useState(() =>
    remainingSeconds(delivery.assignmentExpiresAt),
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (!isAssigned || countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [isAssigned, countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleAccept = async (e: React.MouseEvent) => {
    stop(e);
    setActionLoading(true);
    try { await acceptDelivery(delivery.id); onAction?.(); }
    catch { /* polling */ } finally { setActionLoading(false); }
  };

  const handleReject = async (e: React.MouseEvent) => {
    stop(e);
    setRejectLoading(true);
    try { await rejectDelivery(delivery.id); onAction?.(); }
    catch { /* polling */ } finally { setRejectLoading(false); }
  };

  const handlePickup = async (e: React.MouseEvent) => {
    stop(e);
    setActionLoading(true);
    try { await pickupDelivery(delivery.id); onAction?.(); }
    catch { /* polling */ } finally { setActionLoading(false); }
  };

  const handleStart = async (e: React.MouseEvent) => {
    stop(e);
    setActionLoading(true);
    try { await startDelivery(delivery.id); onAction?.(); }
    catch { /* polling */ } finally { setActionLoading(false); }
  };

  const handleComplete = async (e: React.MouseEvent) => {
    stop(e);
    setActionLoading(true);
    try { await completeDelivery(delivery.id); onAction?.(); }
    catch { /* polling */ } finally { setActionLoading(false); }
  };

  const urgency = isAssigned && countdown > 0 && countdown <= 30;

  const statusBorderClass = isAssigned
    ? urgency
      ? 'border-red-500/30 shadow-[0_0_30px_-8px_rgba(239,68,68,0.15)]'
      : 'border-amber-500/25 shadow-[0_0_30px_-8px_rgba(245,158,11,0.1)]'
    : delivery.status === 'ACCEPTED'
      ? 'border-blue-500/20'
      : delivery.status === 'PICKED_UP'
        ? 'border-violet-500/20'
        : delivery.status === 'IN_TRANSIT'
          ? 'border-primary/20 shadow-[0_0_24px_-8px_hsl(152,55%,45%/0.1)]'
          : 'border-white/[0.06]';

  const instruction = STATUS_INSTRUCTION[delivery.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 28 }}
      className={cn('overflow-hidden rounded-3xl border bg-card transition-all', statusBorderClass)}
    >
      {/* Timer progress bar for ASSIGNED */}
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
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DeliveryStatusBadge status={delivery.status} />
            {instruction && (
              <span className="text-[11px] text-muted-foreground">{instruction}</span>
            )}
          </div>
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

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              {address ? (
                <MapPin className="h-4 w-4 text-orange-400" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">
                {customer.firstName} {customer.lastName}
              </div>
              {address ? (
                <div className="truncate text-xs text-muted-foreground">
                  {address.street}, {address.city}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">Adresse à confirmer</div>
              )}
            </div>
          </div>
        </div>

        {/* Notes preview */}
        {notes && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-500/5 p-2.5">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
            <span className="line-clamp-2 text-xs text-muted-foreground">{notes}</span>
          </div>
        )}

        {/* Items + arrow */}
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </button>

      {/* Navigation shortcut */}
      <NavShortcut delivery={delivery} />

      {/* ── Inline actions ──────────────────────── */}

      {/* ASSIGNED: Accept + Reject */}
      {delivery.status === 'ASSIGNED' && (
        <div className="flex gap-2.5 border-t border-white/[0.06] px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReject}
            disabled={rejectLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-semibold text-red-400"
          >
            {rejectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Refuser
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAccept}
            disabled={actionLoading}
            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Accepter
          </motion.button>
        </div>
      )}

      {/* ACCEPTED: Pickup */}
      {delivery.status === 'ACCEPTED' && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePickup}
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-blue-700"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Commande récupérée
          </motion.button>
        </div>
      )}

      {/* PICKED_UP: Start */}
      {delivery.status === 'PICKED_UP' && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-violet-700"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Démarrer la livraison
          </motion.button>
        </div>
      )}

      {/* IN_TRANSIT: Complete */}
      {delivery.status === 'IN_TRANSIT' && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleComplete}
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Confirmer la livraison
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
