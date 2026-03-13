'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { type Delivery } from '@/lib/api/driver';
import { DeliveryStatusBadge } from './delivery-status-badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  delivery: Delivery;
  index?: number;
}

export function HistoryDeliveryCard({ delivery, index = 0 }: Props) {
  const router = useRouter();
  const isDelivered = delivery.status === 'DELIVERED';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => router.push(`/driver/deliveries/${delivery.id}`)}
      className="w-full rounded-2xl border border-white/[0.06] bg-card p-4 text-left transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isDelivered ? 'bg-emerald-500/10' : 'bg-red-500/10',
            )}
          >
            <MapPin className={cn('h-5 w-5', isDelivered ? 'text-emerald-400' : 'text-red-400')} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {delivery.order.restaurant.name}
            </div>
            <div className="text-[11px] text-muted-foreground">{formatDate(delivery.createdAt)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <div
              className={cn(
                'text-sm font-bold',
                isDelivered ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {isDelivered ? `+${formatCurrency(delivery.deliveryFee)}` : '--'}
            </div>
            <DeliveryStatusBadge status={delivery.status} />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>
    </motion.button>
  );
}
