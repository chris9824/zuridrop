'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Clock, ChefHat, Bell, DollarSign,
  TrendingUp, ArrowRight, Store, CheckCircle, Wallet,
  Activity, XCircle, Percent,
} from 'lucide-react';
import {
  getIncomingOrders, getActiveOrders, getOrderHistory, getMyRestaurants,
  type Order, type Restaurant,
} from '@/lib/api/merchant';
import { computeMetrics, type DashboardMetrics } from '@/lib/merchant-stats';
import { StatsCard } from '@/components/merchant/stats-card';
import { OrderCard } from '@/components/merchant/order-card';
import { EmptyState } from '@/components/merchant/empty-state';
import { usePolling } from '@/hooks/use-polling';
import { formatCurrency } from '@/lib/format';

const EMPTY_METRICS: DashboardMetrics = {
  todayTotal: 0, todayDelivered: 0, todayCancelled: 0,
  todayRevenue: 0, avgBasket: 0, activeCount: 0,
  pendingCount: 0, preparingCount: 0, readyCount: 0,
  acceptedCount: 0, conversionRate: 0,
};

export default function DashboardPage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pending, setPending] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);

  const fetchAll = useCallback(async () => {
    try {
      const [inc, act, hist, rests] = await Promise.all([
        getIncomingOrders(),
        getActiveOrders(),
        getOrderHistory(1, 200),
        getMyRestaurants(),
      ]);

      setPending(inc.data);
      if (rests.length > 0) setRestaurant(rests[0]);

      setMetrics(computeMetrics(inc.data, act.data, hist.data));
    } catch {
      /* graceful */
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  usePolling(fetchAll, 10000);

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            {restaurant && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground lg:text-2xl">
                {restaurant ? `Bonjour, ${restaurant.name}` : 'Tableau de bord'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {restaurant?.isOpen
                  ? <span className="text-primary font-medium">Restaurant ouvert</span>
                  : <span className="text-red-400 font-medium">Restaurant fermé</span>}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Section 1 : Aujourd'hui ─────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Performance du jour</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <StatsCard
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Commandes"
              hint="Total créé aujourd'hui"
              value={metrics.todayTotal}
              index={0}
            />
            <StatsCard
              icon={<CheckCircle className="h-5 w-5" />}
              label="Livrées"
              hint="Commandes livrées avec succès"
              value={metrics.todayDelivered}
              accent="text-emerald-400"
              index={1}
            />
            <StatsCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Revenu"
              hint="Basé sur les commandes livrées"
              value={formatCurrency(metrics.todayRevenue)}
              accent="text-emerald-400"
              index={2}
            />
            <StatsCard
              icon={<Wallet className="h-5 w-5" />}
              label="Panier moyen"
              hint="Moyenne des commandes livrées"
              value={metrics.avgBasket > 0 ? formatCurrency(metrics.avgBasket) : '—'}
              accent="text-blue-400"
              index={3}
            />
            <StatsCard
              icon={<XCircle className="h-5 w-5" />}
              label="Annulées"
              hint="Commandes annulées aujourd'hui"
              value={metrics.todayCancelled}
              accent="text-red-400"
              index={4}
            />
            <StatsCard
              icon={<Percent className="h-5 w-5" />}
              label="Taux de succès"
              hint="Livrées / total du jour"
              value={metrics.todayTotal > 0 ? `${metrics.conversionRate}%` : '—'}
              accent="text-violet-400"
              index={5}
            />
          </div>
        </div>

        {/* ── Section 2 : Temps réel ──────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">En temps réel</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatsCard
              icon={<Clock className="h-5 w-5" />}
              label="En attente"
              hint="Commandes PENDING"
              value={metrics.pendingCount}
              accent="text-amber-400"
              index={0}
            />
            <StatsCard
              icon={<ChefHat className="h-5 w-5" />}
              label="En préparation"
              hint="Acceptées + en cuisine"
              value={metrics.preparingCount}
              accent="text-orange-400"
              index={1}
            />
            <StatsCard
              icon={<Bell className="h-5 w-5" />}
              label="Prêtes"
              hint="En attente du livreur"
              value={metrics.readyCount}
              accent="text-cyan-400"
              index={2}
            />
            <StatsCard
              icon={<Activity className="h-5 w-5" />}
              label="Actives"
              hint="Toutes commandes non terminées"
              value={metrics.activeCount}
              accent="text-primary"
              index={3}
            />
          </div>
        </div>

        {/* Kitchen Mode CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push('/merchant/kitchen')}
          className="flex w-full items-center justify-between rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-4 transition-colors hover:bg-orange-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <ChefHat className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-foreground">Mode Cuisine</div>
              <div className="text-xs text-muted-foreground">Vue KDS optimisée pour la cuisine et les tablettes</div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-orange-400" />
        </motion.button>

        {/* Pending Orders + Activity Panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Commandes en attente
                {pending.length > 0 && (
                  <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-400">
                    {pending.length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => router.push('/merchant/orders')}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Tout voir <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {pending.length === 0 ? (
              <EmptyState
                title="Aucune commande en attente"
                description="Les nouvelles commandes apparaîtront ici automatiquement."
              />
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 5).map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i} onUpdated={fetchAll} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Activité en cours</h2>
            <div className="rounded-2xl border border-white/[0.06] bg-card p-4 space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-bold text-foreground">{metrics.activeCount} commande{metrics.activeCount > 1 ? 's' : ''} active{metrics.activeCount > 1 ? 's' : ''}</div>
                  <div className="text-xs text-muted-foreground">en cours de traitement</div>
                </div>
              </div>
              {metrics.pendingCount > 0 && (
                <div className="rounded-xl bg-amber-500/5 p-3">
                  <div className="text-xs font-semibold text-amber-400">{metrics.pendingCount} en attente</div>
                  <div className="text-[11px] text-muted-foreground">À accepter</div>
                </div>
              )}
              {metrics.acceptedCount > 0 && (
                <div className="rounded-xl bg-blue-500/5 p-3">
                  <div className="text-xs font-semibold text-blue-400">{metrics.acceptedCount} acceptée{metrics.acceptedCount > 1 ? 's' : ''}</div>
                  <div className="text-[11px] text-muted-foreground">En attente de préparation</div>
                </div>
              )}
              {(metrics.preparingCount - metrics.acceptedCount) > 0 && (
                <div className="rounded-xl bg-orange-500/5 p-3">
                  <div className="text-xs font-semibold text-orange-400">{metrics.preparingCount - metrics.acceptedCount} en préparation</div>
                  <div className="text-[11px] text-muted-foreground">En cuisine</div>
                </div>
              )}
              {metrics.readyCount > 0 && (
                <div className="rounded-xl bg-cyan-500/5 p-3">
                  <div className="text-xs font-semibold text-cyan-400">{metrics.readyCount} prête{metrics.readyCount > 1 ? 's' : ''}</div>
                  <div className="text-[11px] text-muted-foreground">En attente du livreur</div>
                </div>
              )}
              {metrics.activeCount === 0 && (
                <p className="text-xs text-muted-foreground">Aucune commande active pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
