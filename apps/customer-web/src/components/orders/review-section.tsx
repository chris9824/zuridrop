'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Store, Truck, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOrderReviews, createReview, type ApiReview } from '@/lib/api/reviews';
import { cn } from '@/lib/utils';

interface ReviewSectionProps {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  driverId: string | null;
  driverName: string | null;
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(star)}
          className={cn(
            'rounded p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30',
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110',
          )}
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({
  orderId,
  restaurantId: _restaurantId,
  restaurantName,
  driverId,
  driverName,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');
  const [restaurantSubmitting, setRestaurantSubmitting] = useState(false);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [driverRating, setDriverRating] = useState(0);
  const [driverComment, setDriverComment] = useState('');
  const [driverSubmitting, setDriverSubmitting] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);

  const hasRestaurantReview = reviews.some((r) => r.type === 'RESTAURANT');
  const hasDriverReview = reviews.some((r) => r.type === 'DRIVER');

  useEffect(() => {
    getOrderReviews(orderId)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSubmitRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restaurantRating < 1 || restaurantRating > 5) return;
    setRestaurantSubmitting(true);
    setRestaurantError(null);
    try {
      const created = await createReview({
        orderId,
        type: 'RESTAURANT',
        rating: restaurantRating,
        comment: restaurantComment.trim() || undefined,
      });
      setReviews((prev) => [...prev, created]);
      setRestaurantRating(0);
      setRestaurantComment('');
    } catch (err) {
      setRestaurantError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setRestaurantSubmitting(false);
    }
  };

  const handleSubmitDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || driverRating < 1 || driverRating > 5) return;
    setDriverSubmitting(true);
    setDriverError(null);
    try {
      const created = await createReview({
        orderId,
        type: 'DRIVER',
        rating: driverRating,
        comment: driverComment.trim() || undefined,
      });
      setReviews((prev) => [...prev, created]);
      setDriverRating(0);
      setDriverComment('');
    } catch (err) {
      setDriverError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setDriverSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasRestaurantReview && (hasDriverReview || !driverId)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6"
      >
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Merci pour vos avis !</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos retours nous aident à améliorer le service ZuriDrop.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-base font-bold text-foreground">Donnez votre avis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Votre retour nous aide à améliorer le service.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Restaurant review */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">{restaurantName}</h3>
          </div>

          {hasRestaurantReview ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Avis envoyé</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitRestaurant} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Note (1 à 5 étoiles)
                </label>
                <StarRating
                  value={restaurantRating}
                  onChange={setRestaurantRating}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={restaurantComment}
                  onChange={(e) => setRestaurantComment(e.target.value)}
                  placeholder="Ex: Excellent repas, merci !"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {restaurantError && (
                <p className="text-xs text-destructive">{restaurantError}</p>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={restaurantRating < 1 || restaurantSubmitting}
              >
                {restaurantSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Envoyer'
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Driver review */}
        {driverId && driverName && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{driverName}</h3>
            </div>

            {hasDriverReview ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Avis envoyé</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitDriver} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Note (1 à 5 étoiles)
                  </label>
                  <StarRating
                    value={driverRating}
                    onChange={setDriverRating}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={driverComment}
                    onChange={(e) => setDriverComment(e.target.value)}
                    placeholder="Ex: Livraison rapide et soignée"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {driverError && (
                  <p className="text-xs text-destructive">{driverError}</p>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={driverRating < 1 || driverSubmitting}
                >
                  {driverSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Envoyer'
                  )}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
