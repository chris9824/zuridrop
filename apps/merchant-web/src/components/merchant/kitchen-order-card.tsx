'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Hash, User, Package, MessageSquare, Loader2,
  Check, ChefHat, Bell, X, Clock, Sparkles,
  UserCheck, Phone, Bike,
} from 'lucide-react';
import { type Order, acceptOrder, startPreparing, readyForPickup, cancelOrder } from '@/lib/api/merchant';
import { useToast } from './toast';
import { formatCurrency } from '@/lib/format';
import { isNewOrder } from '@/lib/order-utils';
import { cn } from '@/lib/cn';

const NEW_THRESHOLD_MS = 30_000;

interface Props {
  order: Order;
  index?: number;
  onUpdated: () => void;
}

const ACTIONS: Record<string, { label: string; icon: typeof Check; bg: string; action: (id: string) => Promise<unknown>; successMsg: string } | undefined> = {
  PENDING: { label: 'Accepter', icon: Check, bg: 'bg-primary hover:bg-primary/90', action: acceptOrder, successMsg: 'Commande acceptée' },
  ACCEPTED: { label: 'Commencer', icon: ChefHat, bg: 'bg-orange-600 hover:bg-orange-700', action: startPreparing, successMsg: 'Préparation démarrée' },
  PREPARING: { label: 'Prête !', icon: Bell, bg: 'bg-cyan-600 hover:bg-cyan-700', action: readyForPickup, successMsg: 'Commande prête !' },
};

function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(since).getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`);
      setUrgent(mins >= 5);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [since]);

  return (
    <span className={cn(
      'flex items-center gap-1 font-mono text-xs font-bold tabular-nums',
      urgent ? 'text-red-400' : 'text-muted-foreground',
    )}>
      <Clock className="h-3 w-3" />
      {elapsed}
    </span>
  );
}

export function KitchenOrderCard({ order, index = 0, onUpdated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isNew, setIsNew] = useState(() => isNewOrder(order, NEW_THRESHOLD_MS));
  const config = ACTIONS[order.status];
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED';
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

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
      toast('success', 'Commande refusée');
      onUpdated();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCancelling(false);
    }
  };

  const borderColor =
    order.status === 'PENDING' ? 'border-amber-500/30' :
    order.status === 'PREPARING' ? 'border-orange-500/20' :
    order.status === 'READY_FOR_PICKUP' ? 'border-cyan-500/30' :
    'border-white/[0.06]';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'rounded-2xl border bg-card overflow-hidden relative',
        borderColor,
        isNew && 'ring-2 ring-amber-400/50 animate-pulse-glow',
      )}
    >
      {/* New order banner */}
      {isNew && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 px-4 py-2"
        >
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Nouvelle commande</span>
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
        </motion.div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-base font-black text-foreground">
            <Hash className="h-4 w-4 text-primary" />
            {order.id.slice(-6).toUpperCase()}
          </span>
          <ElapsedTimer since={order.createdAt} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-base font-bold text-foreground">{order.customer.firstName} {order.customer.lastName}</span>
        </div>

        <div className="rounded-xl bg-muted/30 p-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <span className="text-base font-semibold text-foreground leading-tight">
                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-primary/10 px-1.5 text-xs font-black text-primary mr-2">
                  {item.quantity}
                </span>
                {item.menuItem.name}
              </span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span className="text-sm font-medium text-amber-200/80">{order.notes}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </span>
          <span className="text-lg font-black text-primary">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {(config || canCancel) && (
        <div className="flex gap-2 border-t border-white/[0.06] p-3">
          {canCancel && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              disabled={cancelling}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-4 text-base font-bold text-red-400"
            >
              {cancelling ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
              Refuser
            </motion.button>
          )}
          {config && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAction}
              disabled={loading}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl py-4 text-base font-black text-white shadow-lg',
                canCancel ? 'flex-[2]' : 'w-full',
                config.bg,
              )}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <config.icon className="h-5 w-5" />}
              {config.label}
            </motion.button>
          )}
        </div>
      )}

      {order.status === 'READY_FOR_PICKUP' && (
        <ReadyForPickupFooter driver={order.delivery?.driver ?? null} />
      )}

      {order.status === 'PICKED_UP' && (
        <div className="flex items-center justify-center gap-2 border-t border-green-500/20 bg-green-500/5 px-4 py-3">
          <Bike className="h-4 w-4 text-green-400" />
          <span className="text-sm font-bold text-green-400">Commande récupérée</span>
        </div>
      )}
    </motion.div>
  );
}

function ReadyForPickupFooter({ driver }: { driver: { id: string; firstName: string; lastName: string; phone?: string | null } | null | undefined }) {
  if (!driver) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
        <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
        <span className="text-sm font-bold text-cyan-400">En attente du livreur</span>
      </div>
    );
  }

  return (
    <div className="border-t border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15">
          <UserCheck className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-indigo-300">
              {driver.firstName} {driver.lastName}
            </span>
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Livreur assigné
            </span>
          </div>
          {driver.phone && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {driver.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
