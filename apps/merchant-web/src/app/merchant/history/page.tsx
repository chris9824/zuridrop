'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History, DollarSign, ShoppingBag, Loader2 } from 'lucide-react';
import { getOrderHistory, type Order } from '@/lib/api/merchant';
import { HistoryCard } from '@/components/merchant/history-card';
import { StatsCard } from '@/components/merchant/stats-card';
import { EmptyState } from '@/components/merchant/empty-state';
import { formatCurrency } from '@/lib/format';

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await getOrderHistory(1, 100);
      setOrders(res.data.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED'));
    } catch {
      /* graceful */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const delivered = orders.filter((o) => o.status === 'DELIVERED');
  const totalRevenue = delivered.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Historique</h1>
            <p className="text-xs text-muted-foreground">Commandes passées</p>
          </div>
        </motion.div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatsCard icon={<ShoppingBag className="h-5 w-5" />} label="Commandes livrées" value={delivered.length} index={0} />
          <StatsCard icon={<DollarSign className="h-5 w-5" />} label="Revenu total" value={formatCurrency(totalRevenue)} accent="text-emerald-400" index={1} />
          <StatsCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Panier moyen"
            value={delivered.length ? formatCurrency(Math.round(totalRevenue / delivered.length)) : '—'}
            accent="text-blue-400"
            index={2}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState title="Aucun historique" description="Vos commandes terminées apparaîtront ici." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order, i) => (
              <HistoryCard key={order.id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
