'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { isLoggedIn } from '@/lib/api/auth';
import { getMe, getMyDeliveries, getHistory, getMyDriverSummary, type Delivery, type DriverAvailability } from '@/lib/api/driver';
import { isToday } from '@/lib/format';
import { usePolling } from '@/hooks/use-polling';

import { DriverHeader } from '@/components/driver/driver-header';
import { DriverOnlineCard } from '@/components/driver/driver-online-card';
import { DriverStatsCard } from '@/components/driver/driver-stats-card';
import { ActiveMissionCard } from '@/components/driver/active-mission-card';
import { EmptyMissionsState } from '@/components/driver/empty-missions-state';
import { BottomNav } from '@/components/driver/bottom-nav';

export default function DriverDashboard() {
  const router = useRouter();
  const [driverName, setDriverName] = useState('');
  const [availability, setAvailability] = useState<DriverAvailability>('OFFLINE');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number; reviewCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [me, mine, history, summary] = await Promise.all([
        getMe(),
        getMyDeliveries(),
        getHistory(),
        getMyDriverSummary().catch(() => null),
      ]);
      setDriverName(`${me.firstName} ${me.lastName}`);
      setAvailability(me.availability);
      setDeliveries(mine);

      const todayDone = history.filter(
        (d) => d.status === 'DELIVERED' && isToday(d.deliveredAt || d.createdAt),
      );
      setTodayCount(todayDone.length);
      setTodayEarnings(todayDone.reduce((s, d) => s + d.deliveryFee, 0));
      setRatingSummary(summary);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        router.push('/driver/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/driver/login');
      return;
    }
    fetchData();
  }, [fetchData, router]);

  usePolling(
    () => getMyDeliveries().then(setDeliveries).catch(() => {}),
    5_000,
    !loading,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <DriverHeader driverName={driverName} />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {/* Online / Offline hero card */}
        <DriverOnlineCard availability={availability} onChanged={setAvailability} />

        {/* Today's stats + rating */}
        <DriverStatsCard
          todayCount={todayCount}
          todayEarnings={todayEarnings}
          activeCount={deliveries.length}
          ratingSummary={ratingSummary}
        />

        {/* Active missions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground">Missions actives</h2>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Temps réel
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {deliveries.length === 0 ? (
              <EmptyMissionsState availability={availability} />
            ) : (
              <div className="space-y-3">
                {deliveries.map((d, i) => (
                  <ActiveMissionCard
                    key={d.id}
                    delivery={d}
                    index={i}
                    onAction={fetchData}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
