'use client';

import { Bike, CreditCard, Zap, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface Props {
  todayCount: number;
  todayEarnings: number;
  activeCount: number;
  ratingSummary?: { averageRating: number; reviewCount: number } | null;
}

export function DriverStatsCard({ todayCount, todayEarnings, activeCount, ratingSummary }: Props) {
  const hasReviews = ratingSummary && ratingSummary.reviewCount > 0;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <div className="rounded-2xl border border-white/[0.06] bg-card p-3 text-center">
        <Bike className="mx-auto mb-1 h-5 w-5 text-blue-400" />
        <div className="text-lg font-bold text-foreground">{todayCount}</div>
        <div className="text-[11px] text-muted-foreground">Courses</div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-card p-3 text-center">
        <CreditCard className="mx-auto mb-1 h-5 w-5 text-primary" />
        <div className="truncate text-base font-bold text-primary">
          {formatCurrency(todayEarnings)}
        </div>
        <div className="text-[11px] text-muted-foreground">Gains</div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-card p-3 text-center">
        <Zap className="mx-auto mb-1 h-5 w-5 text-amber-400" />
        <div className="text-lg font-bold text-foreground">{activeCount}</div>
        <div className="text-[11px] text-muted-foreground">En cours</div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-card p-3 text-center">
        <Star className="mx-auto mb-1 h-5 w-5 text-amber-400" />
        <div className="text-lg font-bold text-foreground">
          {hasReviews ? ratingSummary!.averageRating.toFixed(1) : '—'}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {hasReviews ? `${ratingSummary!.reviewCount} avis` : 'Note'}
        </div>
      </div>
    </div>
  );
}
