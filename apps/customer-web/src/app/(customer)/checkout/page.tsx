'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Loader2, AlertTriangle, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { isLoggedIn } from '@/lib/api/auth';
import { getMyAddresses, AuthRequiredError } from '@/lib/api/addresses';
import { createOrder, RestaurantClosedError } from '@/lib/api/orders';
import type { ApiAddress } from '@/lib/api/schemas';
import { AddressSelector } from '@/components/checkout/address-selector';
import { OrderSummary } from '@/components/checkout/order-summary';
import { PromoCodeInput } from '@/components/checkout/promo-code-input';
import { LoginForm } from '@/components/checkout/login-form';
import type { ValidatePromoResult } from '@/lib/api/promotions';
import { cn } from '@/lib/utils';
import { getRestaurantAvailability, type Availability } from '@/lib/availability';

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: 'CASH', label: 'Espèces', icon: Banknote },
  { id: 'CARD', label: 'Carte bancaire', icon: CreditCard },
  { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectAfterLogin = searchParams.get('from');
  const { items, restaurantId, subtotal, clear } = useCart();

  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Availability
  const [availability, setAvailability] = useState<Availability>({
    status: 'OPEN',
    label: 'Ouvert',
    canOrder: true,
  });
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Form
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<ValidatePromoResult | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setAuthChecked(true);
  }, []);

  // Check restaurant availability when cart has items
  useEffect(() => {
    if (!restaurantId || items.length === 0) {
      setAvailabilityChecked(true);
      return;
    }
    let cancelled = false;

    fetch(`/api/restaurants/${restaurantId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setAvailability(getRestaurantAvailability({ isOpen: data.isOpen ?? true }));
        }
      })
      .catch(() => {
        // Network error — assume open
      })
      .finally(() => {
        if (!cancelled) setAvailabilityChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, items.length]);

  // Load addresses when authenticated
  const loadAddresses = useCallback(async () => {
    setAddressLoading(true);
    setAddressError(null);
    try {
      const { data: addrs, defaultAddressId } = await getMyAddresses();
      setAddresses(addrs);
      if (addrs.length > 0 && !selectedAddressId) {
        setSelectedAddressId(defaultAddressId && addrs.some((a) => a.id === defaultAddressId) ? defaultAddressId : addrs[0].id);
      }
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        setAuthenticated(false);
      } else {
        setAddressError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      setAddressLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadAddresses();
    }
  }, [authenticated, loadAddresses]);

  // Submit order
  const handleSubmit = async () => {
    if (!restaurantId || items.length === 0 || !availability.canOrder) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const order = await createOrder({
        restaurantId,
        deliveryAddressId: selectedAddressId || undefined,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.qty })),
        paymentMethod,
        notes: notes.trim() || undefined,
        promoCode: appliedPromo?.valid ? appliedPromo.promoCode : undefined,
      });
      clear();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof RestaurantClosedError) {
        setSubmitError('Le restaurant est fermé pour le moment. Réessayez plus tard.');
        setAvailability(getRestaurantAvailability({ isOpen: false }));
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la commande.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showLogin = authChecked && !authenticated;
  const showEmptyCart = authChecked && authenticated && items.length === 0;
  const showCheckout = authChecked && authenticated && items.length > 0;

  const canSubmit = availability.canOrder && !submitting && items.length > 0;

  const submitLabel = !availability.canOrder
    ? availability.status === 'CLOSED'
      ? 'Restaurant fermé'
      : 'Hors zone de livraison'
    : submitting
      ? ''
      : 'Confirmer la commande';

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <h1 className="text-base font-semibold text-foreground">Passer commande</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* 1 — Login required */}
        {showLogin && (
          <div className="mx-auto max-w-md">
            <LoginForm
              onSuccess={() => setAuthenticated(true)}
              redirectTo={redirectAfterLogin || undefined}
            />
          </div>
        )}

        {/* 2 — Empty cart */}
        {showEmptyCart && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
            <h1 className="text-xl font-semibold text-foreground">Votre panier est vide</h1>
            <p className="text-sm text-muted-foreground">
              Ajoutez des articles depuis un restaurant pour passer commande.
            </p>
            <Link href="/">
              <Button>Voir les restaurants</Button>
            </Link>
          </div>
        )}

        {/* 3 — Checkout form */}
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-5"
          >
            {/* Left column — 3/5 */}
            <div className="space-y-6 lg:col-span-3">
              {/* Availability alert */}
              {availabilityChecked && !availability.canOrder && (
                <div
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${
                    availability.status === 'CLOSED'
                      ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/30'
                      : 'border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/30'
                  }`}
                >
                  <AlertTriangle
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      availability.status === 'CLOSED'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        availability.status === 'CLOSED'
                          ? 'text-red-800 dark:text-red-300'
                          : 'text-orange-800 dark:text-orange-300'
                      }`}
                    >
                      {availability.status === 'CLOSED'
                        ? 'Le restaurant est fermé pour le moment.'
                        : "Ce restaurant n'est pas disponible pour votre zone."}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        availability.status === 'CLOSED'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-orange-700 dark:text-orange-400'
                      }`}
                    >
                      {availability.status === 'CLOSED'
                        ? 'Vous ne pouvez pas passer commande tant que le restaurant est fermé. Réessayez plus tard.'
                        : "Cette adresse n'est pas éligible à la livraison pour ce restaurant."}
                    </p>
                  </div>
                </div>
              )}

              {/* Address */}
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 text-base font-semibold text-foreground">Adresse de livraison</h2>
                <AddressSelector
                  addresses={addresses}
                  selectedId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  loading={addressLoading}
                  error={addressError}
                />
              </section>

              {/* Payment method */}
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 text-base font-semibold text-foreground">Mode de paiement</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = paymentMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition-colors',
                          selected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border bg-background hover:bg-accent',
                        )}
                      >
                        <Icon className={cn('h-5 w-5', selected ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('text-sm font-medium', selected ? 'text-foreground' : 'text-muted-foreground')}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Notes */}
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 text-base font-semibold text-foreground">Notes (optionnel)</h2>
                <textarea
                  placeholder="Instructions spéciales, allergies, code d'accès…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </section>
            </div>

            {/* Right column — 2/5 */}
            <div className="lg:col-span-2">
              <div className="sticky top-20 space-y-5 rounded-2xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground">Résumé de la commande</h2>
                <OrderSummary appliedPromo={appliedPromo} />
                <PromoCodeInput
                  subtotal={subtotal}
                  deliveryFee={500}
                  restaurantId={restaurantId}
                  appliedPromo={appliedPromo}
                  onApplied={setAppliedPromo}
                />

                {/* Error */}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-xs text-destructive">{submitError}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    submitLabel
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
