'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from './cart-provider';
import { CartDrawer } from './cart-drawer';

export function CartIconButton() {
  const { totalQty } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setDrawerOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
        aria-label="Ouvrir le panier"
      >
        <ShoppingBag className="h-4 w-4" />
        <AnimatePresence mode="wait">
          {totalQty > 0 && (
            <motion.span
              key={totalQty}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-md"
            >
              {totalQty}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
