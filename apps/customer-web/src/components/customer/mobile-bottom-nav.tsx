'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'home', label: 'Accueil', icon: Home, href: '/' },
  { id: 'search', label: 'Recherche', icon: Search, href: '/?focus=search' },
  { id: 'orders', label: 'Commandes', icon: ClipboardList, href: '/orders' },
  { id: 'profile', label: 'Compte', icon: User, href: '/account' },
];

function isActive(pathname: string, item: typeof navItems[number]): boolean {
  if (item.id === 'home') return pathname === '/';
  if (item.id === 'orders') return pathname.startsWith('/orders');
  if (item.id === 'profile') return pathname.startsWith('/account');
  return false;
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <motion.div
                animate={active ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="active-dot"
                  className="h-1 w-1 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
