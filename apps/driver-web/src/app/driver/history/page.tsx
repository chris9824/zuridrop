'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Bike, RefreshCw, Clock } from 'lucide-react';
import { isLoggedIn } from '@/lib/api/auth';
import { getHistory, type Delivery } from '@/lib/api/driver';
import { formatCurrency } from '@/lib/format';
import { HistoryDeliveryCard } from '@/components/driver/history-delivery-card';
import { BottomNav } from '@/components/driver/bottom-nav';

export default function DriverHistoryPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/driver/login');
      return;
    }
    getHistory()
      .then(setDeliveries)
      .catch((err) => {
        if (err instanceof Error && err.message === 'AUTH_REQUIRED')
          router.push('/driver/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const delivered = deliveries.filter((d) => d.status === 'DELIVERED');
  const totalEarned = delivered.reduce((s, d) => s + d.deliveryFee, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-[15px] font-bold text-foreground">Historique</h1>
          <span className="text-[11px] text-muted-foreground">
            {deliveries.length} livraison{deliveries.length > 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {/* Earnings summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-5"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <CreditCard className="mx-auto mb-1 h-5 w-5 text-primary" />
              <div className="text-xl font-bold text-primary">{formatCurrency(totalEarned)}</div>
              <div className="text-[11px] text-muted-foreground">Total gagné</div>
            </div>
            <div>
              <Bike className="mx-auto mb-1 h-5 w-5 text-blue-400" />
              <div className="text-xl font-bold text-foreground">{delivered.length}</div>
              <div className="text-[11px] text-muted-foreground">Livrées</div>
            </div>
          </div>
        </motion.div>

        {/* List */}
        {deliveries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.06] bg-card/50 px-6 py-12 text-center">
            <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Aucun historique</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {deliveries.map((d, i) => (
              <HistoryDeliveryCard key={d.id} delivery={d} index={i} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
