'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from './cart-provider';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, subtotal, totalQty, restaurantName, increment, decrement, removeItem, clear } =
    useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed right-0 top-0 z-[90] flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Panier</h2>
                {totalQty > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {totalQty}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le panier">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Votre panier est vide.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {restaurantName && (
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      De <span className="text-foreground">{restaurantName}</span>
                    </p>
                  )}
                  {items.map((item) => (
                    <motion.div
                      key={item.menuItemId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.price.toLocaleString('fr-FR')} F
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-md"
                          onClick={() => decrement(item.menuItemId)}
                          aria-label="Diminuer"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-md"
                          onClick={() => increment(item.menuItemId)}
                          aria-label="Augmenter"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.menuItemId)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="space-y-3 border-t border-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sous-total</span>
                  <span className="text-base font-bold text-foreground">
                    {subtotal.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => { onClose(); router.push('/checkout'); }}
                >
                  Passer au paiement
                </Button>
                <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={clear}>
                  Vider le panier
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
