'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed,
  History, Settings, LogOut, Store, X, ChefHat,
} from 'lucide-react';
import { clearToken } from '@/lib/api/auth';
import { cn } from '@/lib/cn';

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/merchant' },
  { id: 'orders', label: 'Commandes', icon: ClipboardList, path: '/merchant/orders' },
  { id: 'kitchen', label: 'Cuisine', icon: ChefHat, path: '/merchant/kitchen' },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed, path: '/merchant/menu' },
  { id: 'history', label: 'Historique', icon: History, path: '/merchant/history' },
  { id: 'settings', label: 'Paramètres', icon: Settings, path: '/merchant/settings' },
] as const;

interface Props {
  restaurantName: string;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ restaurantName, open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/merchant/login');
  };

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-white/[0.06] bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground leading-tight">
                {restaurantName || 'Mon restaurant'}
              </div>
              <div className="text-[11px] text-muted-foreground">ZuriDrop Partner</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ id, label, icon: Icon, path }) => {
            const active = pathname === path || (path !== '/merchant' && pathname.startsWith(path));
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
