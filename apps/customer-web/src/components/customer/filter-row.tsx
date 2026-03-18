'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Package, Tag, Clock, Banknote } from 'lucide-react';

const filters = [
  { id: 'pickup', label: 'À emporter', icon: Package },
  { id: 'offers', label: 'Promos', icon: Tag },
  { id: 'free-delivery', label: 'Livraison gratuite', icon: Banknote },
  { id: 'under-30', label: 'Moins de 30 min', icon: Clock },
];

export function FilterRow() {
  const [active, setActive] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map((f) => {
        const Icon = f.icon;
        const isActive = active.has(f.id);
        return (
          <motion.button
            key={f.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => toggle(f.id)}
            aria-pressed={isActive}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {f.label}
          </motion.button>
        );
      })}
    </div>
  );
}
