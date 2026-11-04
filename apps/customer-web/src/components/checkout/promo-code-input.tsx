'use client';

import { useState } from 'react';
import { Loader2, Tag, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validatePromo, type ValidatePromoResult } from '@/lib/api/promotions';
import { cn } from '@/lib/utils';

interface PromoCodeInputProps {
  subtotal: number;
  deliveryFee: number;
  restaurantId: string | null;
  appliedPromo: ValidatePromoResult | null;
  onApplied: (result: ValidatePromoResult | null) => void;
}

export function PromoCodeInput({
  subtotal,
  deliveryFee,
  restaurantId,
  appliedPromo,
  onApplied,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const result = await validatePromo({
        code: trimmed,
        subtotal,
        deliveryFee,
        restaurantId: restaurantId ?? undefined,
      });

      if (result.valid) {
        setCode('');
        setError(null);
        onApplied(result);
      } else {
        setError(result.message ?? 'Code invalide');
        onApplied(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
      onApplied(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setError(null);
    onApplied(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Code promo</label>
      {appliedPromo?.valid ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            {appliedPromo.promoCode} appliqué
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Retirer
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="WELCOME10"
              className={cn(
                'w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                error ? 'border-destructive' : 'border-input',
              )}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
          </Button>
        </form>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <X className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
