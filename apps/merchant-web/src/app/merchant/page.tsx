'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Clock, ChefHat, Bell, DollarSign,
  TrendingUp, ArrowRight, Store, CheckCircle, Wallet,
  Activity, XCircle, Percent, Calendar, Trophy,
} from 'lucide-react';
import {
  getIncomingOrders, getDashboardStats, getMyRestaurants,
  type Order, type Restaurant, type DashboardStats,
} from '@/lib/api/merchant';
import { StatsCard } from '@/components/merchant/stats-card';
import { OrderCard } from '@/components/merchant/order-card';
import { EmptyState } from '@/components/merchant/empty-state';
import { usePolling } from '@/hooks/use-polling';
import { formatCurrency } from '@/lib/format';

const EMPTY_LAST_7_DAYS = {
  ordersCount: 0,
  revenue: 0,
  delivered: 0,
  cancelled: 0,
};

const EMPTY_METRICS: DashboardStats = {
  todayTotal: 0,
  todayDelivered: 0,
  todayCancelled: 0,
  todayRevenue: 0,
  avgBasket: 0,
  activeCount: 0,
  pendingCount: 0,
  preparingCount: 0,
  readyCount: 0,
  acceptedCount: 0,
  conversionRate: 0,
  last7Days: EMPTY_LAST_7_DAYS,
  totalRevenue: 0,
  topItems: [],
  dailyData: [],
};

export default function DashboardPage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pending, setPending] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<DashboardStats>(EMPTY_METRICS);

  const fetchAll = useCallback(async () => {
    try {
      const [inc, stats, rests] = await Promise.all([
        getIncomingOrders(),
        getDashboardStats(),
        getMyRestaurants(),
      ]);

      setPending(inc.data);
      if (rests.length > 0) setRestaurant(rests[0]);
      setMetrics(stats);
    } catch (err) {
      console.error('[Dashboard] Failed to fetch stats:', err);
      /* keep previous metrics on error */
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
              {restaurant && (
                <p className="text-sm text-muted-foreground">
                  {restaurant.isOpen
                    ? <span className="text-primary font-medium">Restaurant ouvert</span>
                    : <span className="text-red-400 font-medium">Restaurant fermé</span>}
                </p>
              )}
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

        {/* ── Section 3 : Vue sur 7 jours + Revenu total ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Vue sur 7 jours</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatsCard
                icon={<Calendar className="h-5 w-5" />}
                label="Commandes"
                hint="7 derniers jours"
                value={metrics.last7Days?.ordersCount ?? 0}
                accent="text-primary"
                index={0}
              />
              <StatsCard
                icon={<CheckCircle className="h-5 w-5" />}
                label="Livrées"
                hint="7 derniers jours"
                value={metrics.last7Days?.delivered ?? 0}
                accent="text-emerald-400"
                index={1}
              />
              <StatsCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Revenu"
                hint="7 derniers jours"
                value={formatCurrency(metrics.last7Days?.revenue ?? 0)}
                accent="text-emerald-400"
                index={2}
              />
              <StatsCard
                icon={<XCircle className="h-5 w-5" />}
                label="Annulées"
                hint="7 derniers jours"
                value={metrics.last7Days?.cancelled ?? 0}
                accent="text-red-400"
                index={3}
              />
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenu total</h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Wallet className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(metrics.totalRevenue ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Toutes commandes livrées</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Section 4 : Graphique 7 jours ─────────────── */}
        {(metrics.dailyData?.length ?? 0) > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Évolution sur 7 jours
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.06] bg-card p-4"
            >
              <div className="flex items-end justify-between gap-2">
                {(metrics.dailyData ?? []).map((d) => {
                  const daily = metrics.dailyData ?? [];
                  const maxOrders = Math.max(...daily.map((x) => x.orders), 1);
                  const heightPct = maxOrders > 0 ? (d.orders / maxOrders) * 100 : 0;
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-20 w-full items-end justify-center">
                        <div
                          className="w-full max-w-10 rounded-t-md bg-primary/70 transition-all"
                          style={{ height: `${Math.max(heightPct, 6)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{d.date}</span>
                      <span className="text-[10px] font-semibold text-foreground tabular-nums">{d.orders}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Nombre de commandes par jour</p>
            </motion.div>
          </div>
        )}

        {/* ── Section 5 : Top plats vendus ─────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Top plats vendus
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.06] bg-card p-4"
          >
            {(metrics.topItems?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {(metrics.topItems ?? []).map((item, i) => (
                  <div
                    key={`${item.name}-${i}`}
                    className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-primary">{item.quantity} vendus</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">Aucune vente enregistrée</p>
                <p className="text-[11px] text-muted-foreground/60">Les plats les plus vendus apparaîtront ici</p>
              </div>
            )}
          </motion.div>
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
