'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff, Tag, Loader2 } from 'lucide-react';
import { type MenuItem, toggleMenuItemAvailability } from '@/lib/api/merchant';
import { useToast } from './toast';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  item: MenuItem;
  index?: number;
  onUpdated: () => void;
}

export function MenuItemCard({ item, index = 0, onUpdated }: Props) {
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await toggleMenuItemAvailability(item.id);
      toast('success', item.isAvailable ? 'Article désactivé' : 'Article activé');
      onUpdated();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setToggling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'group rounded-2xl border bg-card overflow-hidden transition-all',
        item.isAvailable ? 'border-white/[0.06]' : 'border-red-500/10 opacity-60',
      )}
    >
      {/* Image or placeholder */}
      <div className="relative h-32 w-full bg-muted/30 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}
        {item.category && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            <Tag className="h-2.5 w-2.5" />
            {item.category}
          </span>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-lg bg-red-500/90 px-3 py-1 text-xs font-bold text-white">Indisponible</span>
          </div>
        )}
      </div>

      <div className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground leading-tight">{item.name}</h3>
          <span className="shrink-0 text-sm font-bold text-primary">{formatCurrency(item.price)}</span>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
        )}

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-colors',
            item.isAvailable
              ? 'bg-red-500/5 text-red-400 hover:bg-red-500/10'
              : 'bg-primary/10 text-primary hover:bg-primary/20',
          )}
        >
          {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {item.isAvailable ? 'Désactiver' : 'Activer'}
        </button>
      </div>
    </motion.div>
  );
}
