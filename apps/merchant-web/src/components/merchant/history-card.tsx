'use client';

import { motion } from 'framer-motion';
import { Hash, User, Package, Clock } from 'lucide-react';
import { type Order } from '@/lib/api/merchant';
import { OrderStatusBadge } from './order-status-badge';
import { formatCurrency, formatDate } from '@/lib/format';

interface Props {
  order: Order;
  index?: number;
}

export function HistoryCard({ order, index = 0 }: Props) {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-2xl border border-white/[0.06] bg-card p-4 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(order.createdAt)}
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
          <Hash className="h-3 w-3" />
          {order.id.slice(-6).toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">{order.customer.firstName} {order.customer.lastName}</span>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="h-3 w-3" />
          {itemCount} article{itemCount > 1 ? 's' : ''}
        </span>
        <span className="text-sm font-bold text-primary">{formatCurrency(order.total)}</span>
      </div>
    </motion.div>
  );
}
