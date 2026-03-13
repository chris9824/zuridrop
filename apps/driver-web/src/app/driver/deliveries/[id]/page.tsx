'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Phone, Package,
  RefreshCw, Hash, CreditCard, Store,
} from 'lucide-react';
import { isLoggedIn } from '@/lib/api/auth';
import { getDeliveryById, type Delivery } from '@/lib/api/driver';
import { formatCurrency, timeAgo } from '@/lib/format';
import { usePolling } from '@/hooks/use-polling';
import { DeliveryTimeline } from '@/components/driver/delivery-timeline';
import { DeliveryActions } from '@/components/driver/delivery-actions';
import { DeliveryStatusBadge } from '@/components/driver/delivery-status-badge';
import { MapActionButton } from '@/components/driver/map-action-button';

const TERMINAL = ['DELIVERED', 'CANCELLED', 'REJECTED', 'EXPIRED'];

export default function DeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDelivery = useCallback(async () => {
    try {
      setDelivery(await getDeliveryById(id));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        router.push('/driver/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Livraison introuvable');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/driver/login'); return; }
    fetchDelivery();
  }, [fetchDelivery, router]);

  const currentStatus = delivery?.status;
  const isTerminal = currentStatus ? TERMINAL.includes(currentStatus) : true;

  usePolling(
    () => getDeliveryById(id).then(setDelivery).catch(() => {}),
    5_000,
    !isTerminal,
  );

  const handleUpdated = (d: Delivery | null) => {
    if (!d) { router.push('/driver'); return; }
    setDelivery(d);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-sm text-red-400">{error || 'Livraison introuvable'}</p>
        <button
          onClick={() => router.push('/driver')}
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Retour
        </button>
      </div>
    );
  }

  const { order } = delivery;
  const restaurant = order.restaurant;
  const address = order.deliveryAddress;
  const customer = order.customer;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const hasActions = !TERMINAL.includes(delivery.status);

  const restoAddress = [restaurant.street, restaurant.city].filter(Boolean).join(', ');
  const clientAddress = address ? [address.street, address.city].filter(Boolean).join(', ') : '';

  return (
    <div className={`min-h-screen bg-background ${hasActions ? 'pb-32' : 'pb-6'}`}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.04] bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/driver')}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <DeliveryStatusBadge status={delivery.status} size="md" />
              {!isTerminal && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              {delivery.id.slice(-8)} &middot; {timeAgo(delivery.assignedAt)}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {/* Route visual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/[0.06] bg-card p-5"
        >
          {/* Pickup */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Store className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="mt-1 w-0.5 flex-1 bg-white/[0.06]" />
            </div>
            <div className="flex-1 pb-4">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Récupération
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-foreground">{restaurant.name}</div>
              {restoAddress && (
                <div className="mt-0.5 text-xs text-muted-foreground">{restoAddress}</div>
              )}
              <div className="mt-2">
                <MapActionButton
                  label="Naviguer"
                  lat={restaurant.latitude}
                  lng={restaurant.longitude}
                  address={restoAddress}
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <MapPin className="h-4.5 w-4.5 text-orange-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Livraison
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-foreground">
                {customer.firstName} {customer.lastName}
              </div>
              {clientAddress ? (
                <div className="mt-0.5 text-xs text-muted-foreground">{clientAddress}</div>
              ) : (
                <div className="mt-0.5 text-xs text-muted-foreground italic">
                  Adresse non disponible
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <MapActionButton
                  label="Naviguer"
                  lat={address?.latitude}
                  lng={address?.longitude}
                  address={clientAddress}
                />
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    <Phone className="h-4 w-4" />
                    Appeler
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Order items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-white/[0.06] bg-card p-5"
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Package className="h-4 w-4 text-primary" />
            Commande ({itemCount} article{itemCount > 1 ? 's' : ''})
          </h3>

          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  <span className="text-muted-foreground">{item.quantity}x</span>{' '}
                  {item.menuItem.name}
                </span>
                <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sous-total</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Frais de livraison</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-3 rounded-xl bg-amber-500/5 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-amber-400">Note client :</span> {order.notes}
            </div>
          )}
        </motion.div>

        {/* Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-5 text-center"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            Gain pour cette mission
          </div>
          <div className="mt-1 text-2xl font-bold text-primary">
            {formatCurrency(delivery.deliveryFee)}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border border-white/[0.06] bg-card p-5"
        >
          <h3 className="mb-4 text-sm font-bold text-foreground">Progression</h3>
          <DeliveryTimeline delivery={delivery} />
        </motion.div>
      </main>

      {/* Sticky bottom actions */}
      {hasActions && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-6 pt-4">
          <div className="mx-auto max-w-lg">
            <DeliveryActions delivery={delivery} onUpdated={handleUpdated} />
          </div>
        </div>
      )}
    </div>
  );
}
