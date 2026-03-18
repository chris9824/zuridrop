'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { categories } from '@/lib/mock-data';

interface CategoryRowProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryRow({ selected, onSelect }: CategoryRowProps) {
  const chip = (cat: (typeof categories)[number]) => (
    <motion.button
      key={cat.id}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      onClick={() => onSelect(cat.id)}
      aria-pressed={selected === cat.id}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
        selected === cat.id
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-foreground hover:bg-accent',
      )}
    >
      {cat.emoji && <span className="text-base leading-none">{cat.emoji}</span>}
      {cat.label}
    </motion.button>
  );

  return (
    <div className="py-2">
      {/* Mobile: horizontal scroll — flex-nowrap évite le wrap en colonne */}
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide md:hidden"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {categories.map((cat) => (
          <div key={cat.id} style={{ scrollSnapAlign: 'start' }}>
            {chip(cat)}
          </div>
        ))}
      </div>

      {/* Desktop: flex wrap — hidden sur mobile pour éviter doublon */}
      <div className="hidden flex-row flex-wrap gap-2 md:flex">
        {categories.map(chip)}
      </div>
    </div>
  );
}
