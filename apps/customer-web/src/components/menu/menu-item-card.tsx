'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { cn } from '@/lib/utils';
import type { ApiMenuItem } from '@/lib/api/schemas';

interface MenuItemCardProps {
  item: ApiMenuItem;
  restaurantId: string;
  restaurantName: string;
  /** When true, the add/qty buttons are disabled (restaurant closed or out of zone) */
  disabled?: boolean;
  disabledLabel?: string;
}

export function MenuItemCard({
  item,
  restaurantId,
  restaurantName,
  disabled = false,
  disabledLabel,
}: MenuItemCardProps) {
  const { addItem, increment, decrement, getItemQty } = useCart();
  const qty = getItemQty(item.id);
  const unavailable = !item.isAvailable;
  const blocked = unavailable || disabled;

  const handleAdd = () => {
    if (blocked) return;
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      restaurantId,
      restaurantName,
    });
  };

  return (
    <motion.div
      whileHover={blocked ? undefined : { y: -2 }}
      whileTap={blocked ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group flex items-stretch gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow',
        !blocked && 'hover:shadow-md',
        blocked && 'opacity-50',
      )}
    >
      {/* Color swatch */}
      <div
        className="hidden h-24 w-24 shrink-0 rounded-xl sm:block"
        style={{
          background: `linear-gradient(135deg, hsl(${hashHue(item.id)} 50% 60%) 0%, hsl(${(hashHue(item.id) + 30) % 360} 45% 45%) 100%)`,
        }}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-1">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{item.name}</h4>
          {item.description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <p className="text-sm font-bold text-primary">
          {item.price.toLocaleString('fr-FR')} F
        </p>
      </div>

      {/* Action */}
      <div className="flex shrink-0 items-end">
        {unavailable ? (
          <span className="rounded-lg bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold text-destructive">
            Indisponible
          </span>
        ) : disabled ? (
          <span className="rounded-lg bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {disabledLabel || 'Indisponible'}
          </span>
        ) : qty === 0 ? (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              onClick={handleAdd}
              className="h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-1.5">
            <motion.div whileTap={{ scale: 0.85 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => decrement(item.id)}
                aria-label="Diminuer la quantité"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </motion.div>
            <motion.span
              key={qty}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              className="w-6 text-center text-sm font-bold text-foreground"
            >
              {qty}
            </motion.span>
            <motion.div whileTap={{ scale: 0.85 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => increment(item.id)}
                aria-label="Augmenter la quantité"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}
