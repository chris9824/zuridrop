import { type DeliveryStatus } from '@/lib/api/driver';
import { cn } from '@/lib/cn';

const CFG: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED:   { label: 'Nouvelle',     color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  ACCEPTED:   { label: 'Acceptée',     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  PICKED_UP:  { label: 'Récupérée',    color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  IN_TRANSIT: { label: 'En livraison', color: 'text-primary',     bg: 'bg-primary/10 border-primary/20' },
  DELIVERED:  { label: 'Livrée',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED:  { label: 'Annulée',      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  REJECTED:   { label: 'Refusée',      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  EXPIRED:    { label: 'Expirée',      color: 'text-muted-foreground', bg: 'bg-muted border-border' },
};

interface Props {
  status: DeliveryStatus;
  size?: 'sm' | 'md';
}

export function DeliveryStatusBadge({ status, size = 'sm' }: Props) {
  const c = CFG[status] || CFG.ASSIGNED;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border font-semibold',
        c.bg, c.color,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      )}
    >
      {c.label}
    </span>
  );
}
