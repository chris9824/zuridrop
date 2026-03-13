'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Clock, UserCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const TABS = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/driver' },
  { id: 'history', label: 'Historique', icon: Clock, path: '/driver/history' },
  { id: 'profile', label: 'Profil', icon: UserCircle, path: '/driver/profile' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-[hsl(225,20%,4%)]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {TABS.map(({ id, label, icon: Icon, path }) => {
          const active = pathname === path;
          return (
            <button
              key={id}
              onClick={() => router.push(path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-[22px] w-[22px]',
                  active && 'drop-shadow-[0_0_8px_hsl(152,55%,48%/0.5)]',
                )}
              />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
