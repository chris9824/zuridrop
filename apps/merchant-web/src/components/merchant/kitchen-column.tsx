'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { type Order } from '@/lib/api/merchant';
import { KitchenOrderCard } from './kitchen-order-card';
import { cn } from '@/lib/cn';

interface Props {
  title: string;
  icon: React.ReactNode;
  accent: string;
  orders: Order[];
  onUpdated: () => void;
}

export function KitchenColumn({ title, icon, accent, orders, onUpdated }: Props) {
  return (
    <div className="flex flex-col min-w-[340px] flex-1">
      {/* Column header */}
      <div className={cn(
        'flex items-center justify-between rounded-t-2xl border border-white/[0.06] border-b-0 bg-card px-4 py-3',
      )}>
        <div className="flex items-center gap-2">
          <span className={accent}>{icon}</span>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
        </div>
        <span className={cn(
          'flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-sm font-black',
          orders.length > 0 ? `${accent} bg-white/[0.06]` : 'text-muted-foreground bg-white/[0.03]',
        )}>
          {orders.length}
        </span>
      </div>

      {/* Column body */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-b-2xl border border-white/[0.06] border-t-0 bg-background/50 p-3 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="mb-2 text-muted-foreground/20">{icon}</div>
              <p className="text-sm text-muted-foreground/40">Aucune commande</p>
            </motion.div>
          ) : (
            orders.map((order, i) => (
              <KitchenOrderCard key={order.id} order={order} index={i} onUpdated={onUpdated} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
