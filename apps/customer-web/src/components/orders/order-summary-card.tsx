'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Store, Clock } from 'lucide-react';
import { OrderStatusBadge } from './order-status-badge';
import type { ApiOrderDetail } from '@/lib/api/schemas';

interface OrderSummaryCardProps {
  order: ApiOrderDetail;
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const total = order.totalAmount ?? 0;
  const date = order.createdAt ? formatDate(order.createdAt) : '';

  return (
    <Link href={`/orders/${order.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
      >
        {/* Color indicator */}
        <div
          className="hidden h-16 w-16 shrink-0 rounded-xl sm:flex sm:items-center sm:justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(${hashHue(order.id)} 55% 50%) 0%, hsl(${(hashHue(order.id) + 30) % 360} 45% 40%) 100%)`,
          }}
        >
          <Store className="h-6 w-6 text-white/80" />
        </div>

        {/* Details */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">
              Commande #{order.id.slice(0, 6).toUpperCase()}
            </p>
            <OrderStatusBadge status={order.status} />
          </div>

          {order.restaurant && (
            <p className="text-xs font-medium text-muted-foreground">
              {order.restaurant.name}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {date && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {date}
              </span>
            )}
            <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
            <span className="font-semibold text-foreground">
              {total.toLocaleString('fr-FR')} F
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </motion.div>
    </Link>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}
