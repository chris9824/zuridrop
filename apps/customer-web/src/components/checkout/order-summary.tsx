'use client';

import { useCart } from '@/components/cart/cart-provider';

const DELIVERY_FEE_PLACEHOLDER = 500;

export function OrderSummary() {
  const { items, subtotal, restaurantName } = useCart();

  const total = subtotal + DELIVERY_FEE_PLACEHOLDER;

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
        <span className="text-foreground">{DELIVERY_FEE_PLACEHOLDER.toLocaleString('fr-FR')} F</span>
      </div>

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
