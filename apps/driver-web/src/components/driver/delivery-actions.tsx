'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Package, Truck, Flag, Loader2, AlertTriangle } from 'lucide-react';
import {
  type Delivery,
  type DeliveryStatus,
  acceptDelivery,
  rejectDelivery,
  pickupDelivery,
  startDelivery,
  completeDelivery,
} from '@/lib/api/driver';
import { cn } from '@/lib/cn';

interface ActionDef {
  label: string;
  icon: typeof Check;
  bg: string;
  action: (id: string) => Promise<unknown>;
  confirm?: string;
}

const ACTIONS: Partial<Record<DeliveryStatus, ActionDef>> = {
  ASSIGNED: {
    label: 'Accepter la mission',
    icon: Check,
    bg: 'bg-primary hover:bg-primary/90',
    action: acceptDelivery,
  },
  ACCEPTED: {
    label: 'Commande récupérée',
    icon: Package,
    bg: 'bg-blue-600 hover:bg-blue-700',
    action: pickupDelivery,
  },
  PICKED_UP: {
    label: 'Démarrer la livraison',
    icon: Truck,
    bg: 'bg-violet-600 hover:bg-violet-700',
    action: startDelivery,
  },
  IN_TRANSIT: {
    label: 'Confirmer la livraison',
    icon: Flag,
    bg: 'bg-emerald-600 hover:bg-emerald-700',
    action: completeDelivery,
    confirm: 'Confirmer que la commande a été remise au client ?',
  },
};

interface Props {
  delivery: Delivery;
  onUpdated: (d: Delivery | null) => void;
}

export function DeliveryActions({ delivery, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const config = ACTIONS[delivery.status];
  if (!config) return null;

  const handleMain = async () => {
    if (config.confirm && !confirming) {
      setConfirming(true);
      return;
    }
    setError('');
    setLoading(true);
    setConfirming(false);
    try {
      const result = await config.action(delivery.id);
      onUpdated(result as Delivery);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setError('');
    setRejecting(true);
    try {
      await rejectDelivery(delivery.id, 'Refusée par le driver');
      onUpdated(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setRejecting(false);
    }
  };

  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-3.5 text-sm text-red-400"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {confirming && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-4 text-center text-sm text-foreground"
        >
          {config.confirm}
        </motion.div>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleMain}
        disabled={loading}
        className={cn(
          'flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-bold text-white shadow-lg transition-all',
          config.bg,
          loading && 'opacity-60',
        )}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        {confirming ? 'Confirmer' : config.label}
      </motion.button>

      {delivery.status === 'ASSIGNED' && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleReject}
          disabled={rejecting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-semibold text-red-400 transition-colors"
        >
          {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Refuser la mission
        </motion.button>
      )}
    </div>
  );
}
