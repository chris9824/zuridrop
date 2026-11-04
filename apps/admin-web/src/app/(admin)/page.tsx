'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Store,
  Truck,
  Users,
  TrendingUp,
  Loader2,
  Package,
  DollarSign,
  Activity,
} from 'lucide-react';
import { getDashboard } from '@/lib/api/admin';
import type { DashboardData } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const KPI_ICONS = {
  totalOrders: ShoppingBag,
  ordersToday: Package,
  totalRevenue: DollarSign,
  revenueToday: DollarSign,
  totalRestaurants: Store,
  totalDrivers: Truck,
  totalCustomers: Users,
  activeOrdersCount: Activity,
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, ordersLast7Days, recentOrders, recentRestaurants, recentDrivers } = data;

  const kpiItems = [
    { key: 'totalOrders', label: 'Commandes totales', value: kpis.totalOrders },
    { key: 'ordersToday', label: "Commandes aujourd'hui", value: kpis.ordersToday },
    {
      key: 'totalRevenue',
      label: 'Revenu total (FCFA)',
      value: kpis.totalRevenue.toLocaleString('fr-FR'),
    },
    {
      key: 'revenueToday',
      label: "Revenu aujourd'hui (FCFA)",
      value: kpis.revenueToday.toLocaleString('fr-FR'),
    },
    { key: 'totalRestaurants', label: 'Restaurants', value: kpis.totalRestaurants },
    { key: 'totalDrivers', label: 'Drivers', value: kpis.totalDrivers },
    { key: 'totalCustomers', label: 'Customers', value: kpis.totalCustomers },
    { key: 'activeOrdersCount', label: 'Commandes actives', value: kpis.activeOrdersCount },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d&apos;ensemble de la plateforme ZuriDrop
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((item) => {
          const Icon = KPI_ICONS[item.key as keyof typeof KPI_ICONS];
          return (
            <div key={item.key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold text-foreground">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphique 7 jours */}
      <div className="mb-10 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          Évolution sur 7 jours
        </h2>
        <div className="flex h-32 items-end gap-2">
          {ordersLast7Days.map((day) => {
            const max = Math.max(...ordersLast7Days.map((d) => d.count), 1);
            const h = (day.count / max) * 100;
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/60 transition-all"
                  style={{ height: `${Math.max(h, 4)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
                <span className="text-[10px] font-medium text-foreground">{day.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activité récente */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-bold text-foreground">Dernières commandes</h2>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune commande</p>
            ) : (
              recentOrders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-foreground">#{o.id.slice(-6)}</span>
                    <span className="ml-2 text-muted-foreground">
                      {o.customer.firstName} {o.customer.lastName}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">
                    {o.total.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-bold text-foreground">Derniers restaurants</h2>
          <div className="space-y-2">
            {recentRestaurants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun restaurant</p>
            ) : (
              recentRestaurants.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">{r.name}</span>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-medium',
                      r.isOpen
                        ? 'bg-green-500/15 text-green-600'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {r.isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-bold text-foreground">Derniers drivers</h2>
          <div className="space-y-2">
            {recentDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun driver</p>
            ) : (
              recentDrivers.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {d.firstName} {d.lastName}
                  </span>
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      d.isOnline ? 'bg-green-500' : 'bg-muted-foreground/50',
                    )}
                    title={d.isOnline ? 'En ligne' : 'Hors ligne'}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
