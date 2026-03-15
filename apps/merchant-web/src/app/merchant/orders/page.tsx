'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock, ChefHat, Bell, CheckCircle, Loader2 } from 'lucide-react';
import { getIncomingOrders, getActiveOrders, getOrderHistory, type Order } from '@/lib/api/merchant';
import { OrderCard } from '@/components/merchant/order-card';
import { EmptyState } from '@/components/merchant/empty-state';
import { useToast } from '@/components/merchant/toast';
import { usePolling } from '@/hooks/use-polling';
import { detectNewOrderIds } from '@/lib/order-utils';
import { cn } from '@/lib/cn';

const TABS = [
  { id: 'pending', label: 'En attente', icon: Clock, accent: 'text-amber-400 border-amber-400' },
  { id: 'active', label: 'En cours', icon: ChefHat, accent: 'text-orange-400 border-orange-400' },
  { id: 'ready', label: 'Prêtes', icon: Bell, accent: 'text-cyan-400 border-cyan-400' },
  { id: 'completed', label: 'Terminées', icon: CheckCircle, accent: 'text-emerald-400 border-emerald-400' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function OrdersPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('pending');
  const [pending, setPending] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevPending = useRef<Order[]>([]);
  const initialized = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      const [inc, act, hist] = await Promise.all([
        getIncomingOrders(),
        getActiveOrders(),
        getOrderHistory(1, 50),
      ]);

      const newPending = inc.data;

      if (initialized.current) {
        const newIds = detectNewOrderIds(prevPending.current, newPending);
        if (newIds.length === 1) {
          toast('info', 'Nouvelle commande reçue !');
        } else if (newIds.length > 1) {
          toast('info', `${newIds.length} nouvelles commandes reçues !`);
        }
      }
      initialized.current = true;
      prevPending.current = newPending;

      setPending(newPending);
      setActive(act.data);
      const terminal = hist.data.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');
      setHistory(terminal);
    } catch {
      /* graceful */
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  usePolling(fetchAll, 8000);

  const preparing = active.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING');
  const ready = active.filter((o) => o.status === 'READY_FOR_PICKUP');

  const current: Order[] =
    tab === 'pending' ? pending
    : tab === 'active' ? preparing
    : tab === 'ready' ? ready
    : history;

  const counts: Record<TabId, number> = {
    pending: pending.length,
    active: preparing.length,
    ready: ready.length,
    completed: history.length,
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Commandes</h1>
            <p className="text-xs text-muted-foreground">Gérez vos commandes en temps réel</p>
          </div>
        </motion.div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-card p-1.5">
          {TABS.map(({ id, label, icon: Icon, accent }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                tab === id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-4 w-4', tab === id && accent.split(' ')[0])} />
              {label}
              {counts[id] > 0 && (
                <span className={cn(
                  'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  tab === id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  {counts[id]}
                </span>
              )}
              {tab === id && (
                <motion.div
                  layoutId="order-tab"
                  className={cn('absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full', accent.split(' ')[1] ? `bg-current ${accent.split(' ')[0]}` : 'bg-primary')}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {current.length === 0 ? (
                <EmptyState
                  title={
                    tab === 'pending' ? 'Aucune commande en attente'
                    : tab === 'active' ? 'Aucune commande en préparation'
                    : tab === 'ready' ? 'Aucune commande prête'
                    : 'Aucune commande terminée'
                  }
                  description={
                    tab === 'pending'
                      ? 'Les nouvelles commandes apparaîtront ici.'
                      : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {current.map((order, i) => (
                    <OrderCard key={order.id} order={order} index={i} onUpdated={fetchAll} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
