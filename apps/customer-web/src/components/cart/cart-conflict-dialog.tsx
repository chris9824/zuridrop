'use client';

import { useCart } from './cart-provider';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function CartConflictDialog() {
  const { conflictPending, confirmReplace, cancelReplace, restaurantName } = useCart();

  return (
    <AnimatePresence>
      {conflictPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <h3 className="text-base font-semibold text-foreground">Changer de restaurant ?</h3>
            <p className="text-sm text-muted-foreground">
              Votre panier contient déjà des articles de{' '}
              <span className="font-medium text-foreground">{restaurantName}</span>.
              Vider le panier et continuer ?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={cancelReplace}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={confirmReplace}>
                Vider et continuer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
