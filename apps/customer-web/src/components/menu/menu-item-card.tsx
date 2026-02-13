'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import type { ApiMenuItem } from '@/lib/api/schemas';

interface MenuItemCardProps {
  item: ApiMenuItem;
  restaurantId: string;
  restaurantName: string;
}

export function MenuItemCard({ item, restaurantId, restaurantName }: MenuItemCardProps) {
  const { addItem, increment, decrement, getItemQty } = useCart();
  const qty = getItemQty(item.id);
  const unavailable = !item.isAvailable;

  const handleAdd = () => {
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm ${
        unavailable ? 'opacity-50' : ''
      }`}
    >
      {/* Info */}
      <div className="flex-1 space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
        {item.description && (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-sm font-bold text-primary">
          {item.price.toLocaleString('fr-FR')} F
        </p>
      </div>

      {/* Action */}
      <div className="flex shrink-0 items-center">
        {unavailable ? (
          <span className="rounded-md bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive">
            Indisponible
          </span>
        ) : qty === 0 ? (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              onClick={handleAdd}
              className="h-8 gap-1 rounded-lg px-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-2">
            <motion.div whileTap={{ scale: 0.85 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
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
              className="w-5 text-center text-sm font-semibold text-foreground"
            >
              {qty}
            </motion.span>
            <motion.div whileTap={{ scale: 0.85 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
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
