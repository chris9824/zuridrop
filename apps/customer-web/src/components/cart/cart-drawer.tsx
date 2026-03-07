'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ChevronRight,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from './cart-provider';
import type { Availability } from '@/lib/availability';
import { getRestaurantAvailability } from '@/lib/availability';

const DELIVERY_FEE = 500;

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const {
    items,
    subtotal,
    totalQty,
    restaurantId,
    restaurantName,
    increment,
    decrement,
    removeItem,
    clear,
  } = useCart();

  const total = items.length > 0 ? subtotal + DELIVERY_FEE : 0;

  const [availability, setAvailability] = useState<Availability>({
    status: 'OPEN',
    label: 'Ouvert',
    canOrder: true,
  });
  const [checking, setChecking] = useState(false);

  // Fetch restaurant availability when drawer opens and cart has items
  useEffect(() => {
    if (!open || !restaurantId || items.length === 0) return;
    let cancelled = false;
    setChecking(true);

    fetch(`/api/restaurants/${restaurantId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setAvailability(getRestaurantAvailability({ isOpen: data.isOpen ?? true }));
      })
      .catch(() => {
        // Network error — assume open to avoid false blocking
        if (!cancelled) {
          setAvailability({ status: 'OPEN', label: 'Ouvert', canOrder: true });
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, restaurantId, items.length]);

  const canCheckout = availability.canOrder && items.length > 0;

  const checkoutLabel = !availability.canOrder
    ? availability.status === 'CLOSED'
      ? 'Restaurant fermé'
      : 'Hors zone de livraison'
    : 'Passer au paiement';

  const handleCheckout = useCallback(() => {
    if (!canCheckout) return;
    onClose();
    router.push('/checkout');
  }, [canCheckout, onClose, router]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            aria-hidden
          />

          {/* Drawer panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Panier"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="fixed right-0 top-0 z-[90] flex h-full w-full flex-col border-l border-border bg-background shadow-2xl sm:max-w-[420px]"
          >
            {/* ── Header ──────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Panier</h2>
                  {totalQty > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {totalQty} article{totalQty > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-xl"
                aria-label="Fermer le panier"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* ── Body ────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                /* Empty state */
                <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <ShoppingBag className="h-9 w-9 text-muted-foreground/40" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
                      Votre panier est vide
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ajoutez des plats depuis un restaurant pour commencer.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2 rounded-xl"
                    onClick={() => {
                      onClose();
                      router.push('/');
                    }}
                  >
                    Explorer les restaurants
                  </Button>
                </div>
              ) : (
                <div className="px-5 py-4">
                  {/* Availability warning */}
                  {!checking && !availability.canOrder && (
                    <div
                      className={`mb-4 flex items-start gap-2.5 rounded-xl p-3 ${
                        availability.status === 'CLOSED'
                          ? 'border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/30'
                          : 'border border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/30'
                      }`}
                    >
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          availability.status === 'CLOSED'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}
                      />
                      <p
                        className={`text-xs font-medium ${
                          availability.status === 'CLOSED'
                            ? 'text-red-800 dark:text-red-300'
                            : 'text-orange-800 dark:text-orange-300'
                        }`}
                      >
                        {availability.reason}
                      </p>
                    </div>
                  )}

                  {/* Restaurant badge */}
                  {restaurantName && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-muted/50 px-3.5 py-2.5">
                      <Store className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {restaurantName}
                      </span>
                    </div>
                  )}

                  {/* Item list */}
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.menuItemId}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, x: 60, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CartItemRow
                            item={item}
                            onIncrement={() => increment(item.menuItemId)}
                            onDecrement={() => decrement(item.menuItemId)}
                            onRemove={() => removeItem(item.menuItemId)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer (sticky CTA) ────────────────── */}
            {items.length > 0 && (
              <div className="border-t border-border bg-background px-5 pb-5 pt-4">
                {/* Summary */}
                <div className="space-y-2">
                  <SummaryRow
                    label="Sous-total"
                    value={`${subtotal.toLocaleString('fr-FR')} F`}
                  />
                  <SummaryRow
                    label="Frais de livraison"
                    value={`${DELIVERY_FEE.toLocaleString('fr-FR')} F`}
                  />
                  <div className="my-2 border-t border-dashed border-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">
                      {total.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <motion.div whileTap={canCheckout ? { scale: 0.98 } : undefined} className="mt-4">
                  <Button
                    className="w-full gap-2 rounded-xl py-6 text-sm font-bold"
                    size="lg"
                    disabled={!canCheckout || checking}
                    onClick={handleCheckout}
                  >
                    {checkoutLabel}
                    {canCheckout && <ChevronRight className="h-4 w-4" />}
                  </Button>
                </motion.div>

                {/* Clear */}
                <button
                  onClick={clear}
                  className="mt-3 w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                >
                  Vider le panier
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Cart Item Row ────────────────────────────────── */

interface CartItemRowProps {
  item: { menuItemId: string; name: string; price: number; qty: number };
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  const lineTotal = item.price * item.qty;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/30">
      {/* Color swatch */}
      <div
        className="hidden h-14 w-14 shrink-0 rounded-lg sm:block"
        style={{
          background: `linear-gradient(135deg, hsl(${hashHue(item.menuItemId)} 50% 55%) 0%, hsl(${(hashHue(item.menuItemId) + 30) % 360} 45% 40%) 100%)`,
        }}
      />

      {/* Info */}
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-semibold leading-snug text-foreground">
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.price.toLocaleString('fr-FR')} F × {item.qty}
        </p>
        <p className="text-sm font-bold text-primary">
          {lineTotal.toLocaleString('fr-FR')} F
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex shrink-0 items-center gap-1">
        <motion.div whileTap={{ scale: 0.85 }}>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={onDecrement}
            aria-label="Diminuer la quantité"
          >
            <Minus className="h-3 w-3" />
          </Button>
        </motion.div>

        <motion.span
          key={item.qty}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          className="w-6 text-center text-xs font-bold text-foreground"
        >
          {item.qty}
        </motion.span>

        <motion.div whileTap={{ scale: 0.85 }}>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={onIncrement}
            aria-label="Augmenter la quantité"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.85 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            onClick={onRemove}
            aria-label="Supprimer l'article"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Summary Row ──────────────────────────────────── */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────── */

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}
