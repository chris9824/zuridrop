import { cn } from '@/lib/cn';

const CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:            { label: 'En attente',       color: 'text-amber-400',     bg: 'bg-amber-500/10 border-amber-500/20' },
  ACCEPTED:           { label: 'Acceptée',         color: 'text-blue-400',      bg: 'bg-blue-500/10 border-blue-500/20' },
  PREPARING:          { label: 'En préparation',   color: 'text-orange-400',    bg: 'bg-orange-500/10 border-orange-500/20' },
  READY_FOR_PICKUP:   { label: 'Prête',            color: 'text-cyan-400',      bg: 'bg-cyan-500/10 border-cyan-500/20' },
  PICKED_UP:          { label: 'Récupérée',        color: 'text-violet-400',    bg: 'bg-violet-500/10 border-violet-500/20' },
  IN_TRANSIT:         { label: 'En livraison',     color: 'text-primary',       bg: 'bg-primary/10 border-primary/20' },
  DELIVERED:          { label: 'Livrée',           color: 'text-emerald-400',   bg: 'bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED:          { label: 'Annulée',          color: 'text-red-400',       bg: 'bg-red-500/10 border-red-500/20' },
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'sm' }: Props) {
  const c = CFG[status] || CFG.PENDING;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        c.bg, c.color,
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      )}
    >
      {c.label}
    </span>
  );
}
