'use client';

import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/lib/order-status';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = getStatusConfig(status);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.bgClass,
        config.textClass,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
