'use client';

import { motion } from 'framer-motion';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'home', label: 'Accueil', icon: Home, active: true },
  { id: 'search', label: 'Recherche', icon: Search, active: false },
  { id: 'orders', label: 'Commandes', icon: ClipboardList, active: false },
  { id: 'profile', label: 'Profil', icon: User, active: false },
];

export function MobileBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="flex flex-col items-center gap-0.5 px-4 py-1"
              aria-label={item.label}
              aria-current={item.active ? 'page' : undefined}
            >
              <motion.div
                animate={item.active ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    item.active ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  item.active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
              {item.active && (
                <motion.div
                  layoutId="active-dot"
                  className="h-1 w-1 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
