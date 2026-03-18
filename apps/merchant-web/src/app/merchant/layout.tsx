'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn } from '@/lib/api/auth';
import { getMyRestaurants, type Restaurant } from '@/lib/api/merchant';
import { Sidebar } from '@/components/merchant/sidebar';
import { NewOrderNotifier } from '@/components/merchant/new-order-notifier';
import { Menu, Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/merchant/login';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [checked, setChecked] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    try {
      const list = await getMyRestaurants();
      if (list.length > 0) setRestaurant(list[0]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }
    if (!isLoggedIn()) {
      router.replace('/merchant/login');
      return;
    }
    setChecked(true);
    fetchRestaurant();
  }, [router, fetchRestaurant, isLoginPage]);

  if (!checked) return <LoadingScreen />;

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        restaurantName={restaurant?.name || ''}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-white/[0.06] bg-card px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex-1 text-sm font-bold text-foreground">
            {restaurant?.name || 'ZuriDrop Restaurant'}
          </span>
          <NewOrderNotifier />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
