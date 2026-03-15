'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from './cart-provider';
import { CartDrawer } from './cart-drawer';

interface StickyCartBarProps {
  restaurantId: string;
}

export function StickyCartBar({ restaurantId }: StickyCartBarProps) {
  const { items, totalQty, subtotal, restaurantId: cartRestaurantId } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasItemsForRestaurant = cartRestaurantId === restaurantId && items.length > 0;

  return (
    <>
      <AnimatePresence>
        {hasItemsForRestaurant && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[70] md:bottom-6 md:left-auto md:right-6 md:w-auto"
          >
            {/* Mobile: full-width bar */}
            <div className="md:hidden">
              <div className="border-t border-primary/20 bg-background/95 px-4 pb-5 pt-3 backdrop-blur-xl">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDrawerOpen(true)}
                  className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 shadow-lg shadow-primary/25"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold text-primary-foreground">
                      {totalQty}
                    </span>
                    <span className="text-sm font-bold text-primary-foreground">
                      Voir le panier
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-primary-foreground">
                      {subtotal.toLocaleString('fr-FR')} F
                    </span>
                    <ChevronRight className="h-4 w-4 text-primary-foreground/70" />
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Desktop: floating pill */}
            <div className="hidden md:block">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-4 rounded-2xl bg-primary px-6 py-4 shadow-xl shadow-primary/30 transition-shadow hover:shadow-2xl hover:shadow-primary/40"
              >
                <div className="relative">
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                  <motion.span
                    key={totalQty}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary"
                  >
                    {totalQty}
                  </motion.span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary-foreground">
                    Voir le panier
                  </span>
                  <span className="h-1 w-1 rounded-full bg-primary-foreground/40" />
                  <span className="text-sm font-bold text-primary-foreground">
                    {totalQty} article{totalQty > 1 ? 's' : ''}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-primary-foreground/40" />
                  <span className="text-sm font-bold text-primary-foreground">
                    {subtotal.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-primary-foreground/70" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
