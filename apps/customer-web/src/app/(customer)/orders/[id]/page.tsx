'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Store,
  MapPin,
  FileText,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isLoggedIn } from '@/lib/api/auth';
import { getOrderById, AuthRequiredError, OrderNotFoundError } from '@/lib/api/orders';
import type { ApiOrderDetail } from '@/lib/api/schemas';
import { getStatusConfig, isFinalStatus, getProgressPercent } from '@/lib/order-status';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { LoginForm } from '@/components/checkout/login-form';

const POLL_INTERVAL_MS = 10_000;

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [order, setOrder] = useState<ApiOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setAuthChecked(true);
  }, []);

  const fetchOrder = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      setError(null);
      setNotFound(false);
      return data;
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        setAuthenticated(false);
      } else if (err instanceof OrderNotFoundError) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
      return null;
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    if (authenticated) fetchOrder(true);
  }, [authenticated, fetchOrder]);

  // Polling — only when document visible and status is not final
  useEffect(() => {
    if (!authenticated || !order) return;
    if (isFinalStatus(order.status)) return;

    const poll = async () => {
      if (document.hidden) return;
      const updated = await fetchOrder(false);
      if (updated && isFinalStatus(updated.status)) {
        stopPolling();
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, order?.status]);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  const showLogin = authChecked && !authenticated;

  const statusConfig = order ? getStatusConfig(order.status) : null;
  const progressPercent = order ? getProgressPercent(order.status) : 0;

  const itemCount = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const subtotal = order?.items.reduce((s, i) => s + i.priceAtOrder * i.quantity, 0) ?? 0;
  const deliveryFee = order?.deliveryFee ?? 0;
  const total = order?.totalAmount ?? subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Mes commandes
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Login */}
        {showLogin && (
          <div className="mx-auto max-w-md">
            <LoginForm
              onSuccess={() => setAuthenticated(true)}
              title="Connectez-vous"
              description="Connectez-vous pour voir cette commande."
            />
          </div>
        )}

        {/* Loading */}
        {authenticated && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Not found */}
        {authenticated && !loading && notFound && (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Commande introuvable</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cette commande n&apos;existe pas ou ne vous appartient pas.
            </p>
            <Link href="/orders" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Retour à mes commandes
            </Link>
          </div>
        )}

        {/* Error */}
        {authenticated && !loading && error && !notFound && (
          <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        )}

        {/* Order detail */}
        {authenticated && !loading && order && statusConfig && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* ── Order Header ─────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-mono text-xs text-muted-foreground">
                    Commande #{orderId.slice(0, 8).toUpperCase()}
                  </p>
                  <h1 className="text-lg font-bold text-foreground">
                    {order.restaurant?.name ?? 'Restaurant'}
                  </h1>
                  {order.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  )}
                </div>
                <OrderStatusBadge status={order.status} className="text-sm px-3 py-1" />
              </div>

              {/* Progress bar */}
              {order.status !== 'CANCELLED' && (
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{statusConfig.message}</p>
                </div>
              )}

              {/* Polling indicator */}
              {!isFinalStatus(order.status) && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Mise à jour automatique
                </div>
              )}
            </div>

            {/* ── Timeline ─────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Suivi de la commande</h2>
              <OrderTimeline currentStatus={order.status} />
            </div>

            {/* ── Items ────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Articles ({itemCount})
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.menuItem?.name ?? 'Article'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.priceAtOrder.toLocaleString('fr-FR')} F × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {(item.priceAtOrder * item.quantity).toLocaleString('fr-FR')} F
                    </p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 space-y-2 border-t border-dashed border-border pt-4">
                <SummaryRow label="Sous-total" value={`${subtotal.toLocaleString('fr-FR')} F`} />
                <SummaryRow label="Frais de livraison" value={`${deliveryFee.toLocaleString('fr-FR')} F`} />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-base font-bold text-foreground">
                    {total.toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>
            </div>

            {/* ── Info cards ───────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Restaurant */}
              {order.restaurant && (
                <InfoCard
                  icon={Store}
                  label="Restaurant"
                  value={order.restaurant.name}
                />
              )}

              {/* Payment */}
              {order.paymentMethod && (
                <InfoCard
                  icon={CreditCard}
                  label="Paiement"
                  value={paymentLabel(order.paymentMethod)}
                />
              )}

              {/* Address */}
              {order.deliveryAddress && (
                <InfoCard
                  icon={MapPin}
                  label="Adresse"
                  value={`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                />
              )}

              {/* Notes */}
              {order.notes && (
                <InfoCard
                  icon={FileText}
                  label="Notes"
                  value={order.notes}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link href="/orders">
                <Button variant="outline">Retour aux commandes</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost">Accueil</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────── */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Store;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────── */

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function paymentLabel(method: string): string {
  switch (method) {
    case 'CASH': return 'Espèces';
    case 'CARD': return 'Carte bancaire';
    case 'MOBILE_MONEY': return 'Mobile Money';
    default: return method;
  }
}
