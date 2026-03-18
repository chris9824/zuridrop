'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Clock, Bell, Maximize2, Minimize2,
  RefreshCw, Sparkles,
} from 'lucide-react';
import { getIncomingOrders, getActiveOrders, type Order } from '@/lib/api/merchant';
import { KitchenColumn } from '@/components/merchant/kitchen-column';
import { usePolling } from '@/hooks/use-polling';
import { detectNewOrderIds } from '@/lib/order-utils';

export default function KitchenPage() {
  const [pending, setPending] = useState<Order[]>([]);
  const [preparing, setPreparing] = useState<Order[]>([]);
  const [ready, setReady] = useState<Order[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bannerCount, setBannerCount] = useState(0);
  const prevPending = useRef<Order[]>([]);
  const initialized = useRef(false);
  const bannerTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchAll = useCallback(async () => {
    try {
      const [inc, act] = await Promise.all([
        getIncomingOrders(),
        getActiveOrders(),
      ]);

      const newPending = inc.data;
      const actData = act.data;

      if (initialized.current) {
        const newIds = detectNewOrderIds(prevPending.current, newPending);
        if (newIds.length > 0) {
          setBannerCount(newIds.length);
          if (bannerTimer.current) clearTimeout(bannerTimer.current);
          bannerTimer.current = setTimeout(() => setBannerCount(0), 6000);
        }
      }
      initialized.current = true;
      prevPending.current = newPending;

      setPending(newPending);
      setPreparing(actData.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING'));
      setReady(actData.filter((o) => o.status === 'READY_FOR_PICKUP'));
    } catch {
      /* graceful */
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  usePolling(fetchAll, 5000);

  useEffect(() => {
    return () => { if (bannerTimer.current) clearTimeout(bannerTimer.current); };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const totalActive = pending.length + preparing.length + ready.length;

  return (
    <div className="flex h-full flex-col">
      {/* New order banner */}
      <AnimatePresence>
        {bannerCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500/15 via-amber-500/20 to-amber-500/15 px-4 py-2.5 border-b border-amber-500/20"
          >
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span className="text-sm font-black text-amber-400">
              {bannerCount === 1 ? '1 nouvelle commande reçue' : `${bannerCount} nouvelles commandes reçues`}
            </span>
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kitchen header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between border-b border-white/[0.06] bg-card px-4 py-3 lg:px-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10">
            <ChefHat className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground">Mode Cuisine</h1>
            <p className="text-xs text-muted-foreground">
              {totalActive} commande{totalActive > 1 ? 's' : ''} active{totalActive > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="rounded-xl bg-muted p-2.5 text-muted-foreground transition-colors hover:text-foreground"
            title="Rafraîchir"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="rounded-xl bg-muted p-2.5 text-muted-foreground transition-colors hover:text-foreground"
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {/* KDS columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-4 lg:p-6">
        <KitchenColumn
          title="En attente"
          icon={<Clock className="h-5 w-5" />}
          accent="text-amber-400"
          orders={pending}
          onUpdated={fetchAll}
        />
        <KitchenColumn
          title="En préparation"
          icon={<ChefHat className="h-5 w-5" />}
          accent="text-orange-400"
          orders={preparing}
          onUpdated={fetchAll}
        />
        <KitchenColumn
          title="Prêtes"
          icon={<Bell className="h-5 w-5" />}
          accent="text-cyan-400"
          orders={ready}
          onUpdated={fetchAll}
        />
      </div>
    </div>
  );
}
