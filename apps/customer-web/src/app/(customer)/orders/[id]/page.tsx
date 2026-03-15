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
  Home,
  ShoppingBag,
  Hash,
  CalendarDays,
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Bike,
  Truck,
  PartyPopper,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isLoggedIn } from '@/lib/api/auth';
import { getOrderById, AuthRequiredError, OrderNotFoundError } from '@/lib/api/orders';
import type { ApiOrderDetail } from '@/lib/api/schemas';
import { getStatusConfig, isFinalStatus, getProgressPercent } from '@/lib/order-status';
import type { StatusConfig } from '@/lib/order-status';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { TrackingSection } from '@/components/orders/tracking-section';
import { LoginForm } from '@/components/checkout/login-form';

const POLL_INTERVAL_MS = 10_000;

const HERO_ICONS: Record<StatusConfig['icon'], typeof Clock> = {
  'clock': Clock,
  'check-circle': CheckCircle2,
  'chef-hat': ChefHat,
  'package': Package,
  'bike': Bike,
  'truck': Truck,
  'party': PartyPopper,
  'x-circle': XCircle,
};

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

  useEffect(() => {
    if (authenticated) fetchOrder(true);
  }, [authenticated, fetchOrder]);

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
  const pollingActive = order ? !isFinalStatus(order.status) : false;

  const itemCount = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const subtotal = order?.items.reduce((s, i) => s + itemPrice(i) * i.quantity, 0) ?? 0;
  const deliveryFee = order?.deliveryFee ?? 0;
  const total = order?.totalAmount ?? subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* ── Sticky Header ──────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Mes commandes
          </Link>
          {order && (
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              #{orderId.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* ── Login ──────────────────────────────────── */}
        {showLogin && (
          <div className="mx-auto max-w-md py-10">
            <LoginForm
              onSuccess={() => setAuthenticated(true)}
              title="Connectez-vous"
              description="Connectez-vous pour voir cette commande."
            />
          </div>
        )}

        {/* ── Loading ────────────────────────────────── */}
        {authenticated && loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement de la commande…</p>
          </div>
        )}

        {/* ── Not Found ──────────────────────────────── */}
        {authenticated && !loading && notFound && (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-base font-semibold text-foreground">Commande introuvable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cette commande n&apos;existe pas ou ne vous appartient pas.
            </p>
            <Link href="/orders">
              <Button variant="outline" className="mt-5">
                Retour à mes commandes
              </Button>
            </Link>
          </div>
        )}

        {/* ── Error ──────────────────────────────────── */}
        {authenticated && !loading && error && !notFound && (
          <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vérifiez que le backend est lancé et réessayez.
            </p>
          </div>
        )}

        {/* ── Order Detail ───────────────────────────── */}
        {authenticated && !loading && order && statusConfig && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* ╔══ HERO — Suivi principal ══════════════ */}
            <HeroSection
              order={order}
              orderId={orderId}
              statusConfig={statusConfig}
              progressPercent={progressPercent}
              pollingActive={pollingActive}
            />

            {/* ╔══ LIVE TRACKING — Carte livreur ═══════ */}
            {(order.status === 'IN_TRANSIT' || order.status === 'PICKED_UP' || order.status === 'DELIVERED') && (
              <TrackingSection orderId={orderId} orderStatus={order.status} />
            )}

            {/* ╔══ 2-column layout desktop ════════════ */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Left — Timeline + Quick info (3/5) */}
              <div className="space-y-6 lg:col-span-3">
                {/* Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <h2 className="mb-5 text-base font-bold text-foreground">
                    Suivi de la commande
                  </h2>
                  <OrderTimeline currentStatus={order.status} />
                </motion.div>

                {/* Quick info cards */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {order.restaurant && (
                    <InfoCard icon={Store} label="Restaurant" value={order.restaurant.name} />
                  )}
                  {order.paymentMethod && (
                    <InfoCard icon={CreditCard} label="Paiement" value={paymentLabel(order.paymentMethod)} />
                  )}
                  {order.deliveryAddress && (
                    <InfoCard
                      icon={MapPin}
                      label="Adresse de livraison"
                      value={`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                    />
                  )}
                  {order.notes && (
                    <InfoCard icon={FileText} label="Notes" value={order.notes} />
                  )}
                </motion.div>
              </div>

              {/* Right — Résumé commande (2/5) */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-20">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Résumé ({itemCount} article{itemCount > 1 ? 's' : ''})
                  </h2>

                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                              {item.quantity}
                            </span>
                            <p className="text-sm font-medium text-foreground">
                              {item.menuItem?.name ?? 'Article'}
                            </p>
                          </div>
                          <p className="mt-0.5 pl-7 text-xs text-muted-foreground">
                            {itemPrice(item).toLocaleString('fr-FR')} F l&apos;unité
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-foreground">
                          {(itemPrice(item) * item.quantity).toLocaleString('fr-FR')} F
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Financial summary */}
                  <div className="mt-5 space-y-2.5 border-t border-dashed border-border pt-5">
                    <SummaryRow label="Sous-total" value={`${subtotal.toLocaleString('fr-FR')} F`} />
                    <SummaryRow label="Frais de livraison" value={deliveryFee > 0 ? `${deliveryFee.toLocaleString('fr-FR')} F` : 'Gratuit'} />
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-base font-bold text-foreground">Total</span>
                      <span className="text-lg font-bold text-primary">
                        {total.toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ╔══ Actions ═══════════════════════════ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Link href="/orders">
                <Button variant="outline" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Voir toutes mes commandes
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <Home className="h-4 w-4" />
                  Retour à l&apos;accueil
                </Button>
              </Link>
              {order.status === 'DELIVERED' && order.restaurant && (
                <Link href={`/restaurants/${order.restaurant.id}`}>
                  <Button variant="ghost" className="gap-2 text-primary">
                    <Store className="h-4 w-4" />
                    Commander à nouveau
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* ── Hero Section ──────────────────────────────────────── */

function HeroSection({
  order,
  orderId,
  statusConfig,
  progressPercent,
  pollingActive,
}: {
  order: ApiOrderDetail;
  orderId: string;
  statusConfig: StatusConfig;
  progressPercent: number;
  pollingActive: boolean;
}) {
  const HeroIcon = HERO_ICONS[statusConfig.icon] ?? Clock;
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 md:p-8',
        isCancelled
          ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 dark:border-red-900/30 dark:from-red-950/40 dark:to-red-950/20'
          : isDelivered
            ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-100/50 dark:border-green-900/30 dark:from-green-950/40 dark:to-emerald-950/20'
            : 'border-border bg-gradient-to-br from-card to-accent/30 dark:from-card dark:to-primary/5',
      )}
    >
      {/* Decorative circle */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Icon */}
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg',
            isCancelled
              ? 'bg-red-500 shadow-red-500/25'
              : isDelivered
                ? 'bg-green-500 shadow-green-500/25'
                : 'bg-primary shadow-primary/25',
          )}
        >
          <HeroIcon className="h-7 w-7 text-white" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {statusConfig.heroTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {statusConfig.heroSubtitle}
            </p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              {orderId.slice(0, 8).toUpperCase()}
            </span>
            {order.restaurant && (
              <span className="flex items-center gap-1.5">
                <Store className="h-3 w-3" />
                {order.restaurant.name}
              </span>
            )}
            {order.createdAt && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                {formatDate(order.createdAt)}
              </span>
            )}
            <OrderStatusBadge status={order.status} className="text-xs" />
          </div>

          {/* Progress bar */}
          {!isCancelled && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{statusConfig.etaLabel}</span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    isDelivered
                      ? 'bg-green-500'
                      : 'bg-primary',
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Polling indicator */}
          {pollingActive && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Mise à jour automatique toutes les 10 secondes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────── */

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
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────── */

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

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

function itemPrice(item: { priceAtOrder?: number | null; unitPrice?: number | null; menuItem?: { price?: number } | null }): number {
  return item.unitPrice ?? item.priceAtOrder ?? item.menuItem?.price ?? 0;
}
