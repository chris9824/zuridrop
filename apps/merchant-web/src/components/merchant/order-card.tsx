'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Hash, User, Package, Clock, CreditCard,
  Check, ChefHat, Bell, X, Loader2, MessageSquare, Sparkles,
  UserCheck, Phone as PhoneIcon, Bike,
} from 'lucide-react';
import { type Order, acceptOrder, startPreparing, readyForPickup, cancelOrder } from '@/lib/api/merchant';
import { OrderStatusBadge } from './order-status-badge';
import { useToast } from './toast';
import { formatCurrency, timeAgo } from '@/lib/format';
import { isNewOrder } from '@/lib/order-utils';
import { cn } from '@/lib/cn';

const NEW_THRESHOLD_MS = 60_000;

interface Props {
  order: Order;
  index?: number;
  onUpdated: () => void;
}

const ACTIONS: Record<string, { label: string; icon: typeof Check; bg: string; action: (id: string) => Promise<unknown>; successMsg: string } | undefined> = {
  PENDING: { label: 'Accepter', icon: Check, bg: 'bg-primary hover:bg-primary/90', action: acceptOrder, successMsg: 'Commande acceptée' },
  ACCEPTED: { label: 'Démarrer préparation', icon: ChefHat, bg: 'bg-orange-600 hover:bg-orange-700', action: startPreparing, successMsg: 'Préparation démarrée' },
  PREPARING: { label: 'Marquer prête', icon: Bell, bg: 'bg-cyan-600 hover:bg-cyan-700', action: readyForPickup, successMsg: 'Commande prête !' },
};

export function OrderCard({ order, index = 0, onUpdated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isNew, setIsNew] = useState(() => isNewOrder(order, NEW_THRESHOLD_MS));
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const config = ACTIONS[order.status];
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED';

  useEffect(() => {
    if (!isNew) return;
    const remaining = NEW_THRESHOLD_MS - (Date.now() - new Date(order.createdAt).getTime());
    if (remaining <= 0) { setIsNew(false); return; }
    const timer = setTimeout(() => setIsNew(false), remaining);
    return () => clearTimeout(timer);
  }, [isNew, order.createdAt]);

  const handleAction = async () => {
    if (!config) return;
    setLoading(true);
    try {
      await config.action(order.id);
      toast('success', config.successMsg);
      onUpdated();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      toast('success', 'Commande annulée');
      onUpdated();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'rounded-2xl border bg-card overflow-hidden',
        order.status === 'PENDING' ? 'border-amber-500/25' : 'border-white/[0.06]',
        isNew && 'ring-2 ring-amber-400/40 animate-pulse-glow',
      )}
    >
      {isNew && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 bg-amber-500/10 px-4 py-1.5"
        >
          <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Nouvelle</span>
        </motion.div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeAgo(order.createdAt)}
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Hash className="h-3 w-3" />
            {order.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{order.customer.firstName} {order.customer.lastName}</div>
            {order.deliveryAddress && (
              <div className="truncate text-xs text-muted-foreground">{order.deliveryAddress.street}, {order.deliveryAddress.city}</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 p-3 space-y-1.5">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                <span className="text-muted-foreground">{item.quantity}x</span> {item.menuItem.name}
              </span>
              <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 p-2.5">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
            <span className="line-clamp-2 text-xs text-muted-foreground">{order.notes}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
            <CreditCard className="h-3.5 w-3.5" />
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      {(config || canCancel) && (
        <div className="flex gap-2 border-t border-white/[0.06] px-4 py-3">
          {canCancel && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              disabled={cancelling}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Refuser
            </motion.button>
          )}
          {config && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAction}
              disabled={loading}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg',
                canCancel ? 'flex-[2]' : 'w-full',
                config.bg,
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <config.icon className="h-4 w-4" />}
              {config.label}
            </motion.button>
          )}
        </div>
      )}

      {order.status === 'READY_FOR_PICKUP' && (
        <OrderDriverFooter driver={order.delivery?.driver ?? null} />
      )}

      {order.status === 'PICKED_UP' && (
        <div className="flex items-center justify-center gap-2 border-t border-green-500/20 bg-green-500/5 px-4 py-2.5">
          <Bike className="h-3.5 w-3.5 text-green-400" />
          <span className="text-xs font-bold text-green-400">Commande récupérée par le livreur</span>
        </div>
      )}
    </motion.div>
  );
}

function OrderDriverFooter({ driver }: { driver: { id: string; firstName: string; lastName: string; phone?: string | null } | null | undefined }) {
  if (!driver) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
        <span className="text-xs font-bold text-cyan-400">En attente du livreur</span>
      </div>
    );
  }

  return (
    <div className="border-t border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15">
          <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-300">
              {driver.firstName} {driver.lastName}
            </span>
            <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-400">
              Livreur assigné
            </span>
          </div>
          {driver.phone && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <PhoneIcon className="h-2.5 w-2.5" />
              {driver.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
