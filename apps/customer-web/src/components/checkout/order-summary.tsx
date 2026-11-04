'use client';

import { useCart } from '@/components/cart/cart-provider';
import type { ValidatePromoResult } from '@/lib/api/promotions';

const DELIVERY_FEE = 500;

interface OrderSummaryProps {
  appliedPromo?: ValidatePromoResult | null;
}

export function OrderSummary({ appliedPromo = null }: OrderSummaryProps) {
  const { items, subtotal, restaurantName } = useCart();

  const deliveryFee = DELIVERY_FEE;
  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  return (
    <div className="space-y-4">
      {/* Restaurant name */}
      {restaurantName && (
        <p className="text-xs font-medium text-muted-foreground">
          De <span className="text-foreground">{restaurantName}</span>
        </p>
      )}

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                {item.qty}
              </span>
              <span className="text-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-foreground">
              {(item.price * item.qty).toLocaleString('fr-FR')} F
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sous-total</span>
        <span className="text-foreground">{subtotal.toLocaleString('fr-FR')} F</span>
      </div>

      {/* Delivery fee */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Frais de livraison</span>
        <span className="text-foreground">{deliveryFee.toLocaleString('fr-FR')} F</span>
      </div>

      {/* Promo discount */}
      {discountAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600 dark:text-green-400">Réduction promo</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            -{discountAmount.toLocaleString('fr-FR')} F
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="text-lg font-bold text-primary">{total.toLocaleString('fr-FR')} F</span>
      </div>
    </div>
  );
}
