'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ShoppingBag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { AccountMenu } from '@/components/account/account-menu';
import { useCart } from '@/components/cart/cart-provider';
import { CartDrawer } from '@/components/cart/cart-drawer';

interface HeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ searchTerm, onSearchChange }: HeaderProps = {}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { totalQty } = useCart();

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          {/* Logo */}
          <Link href="/">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 text-xl font-bold tracking-tight text-primary select-none"
            >
              ZuriDrop
            </motion.span>
          </Link>

          {/* Location — hidden on mobile */}
          <button
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent md:flex"
            aria-label="Changer l'adresse de livraison"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="max-w-[160px] truncate">Cocody, Abidjan</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un restaurant ou un plat…"
              aria-label="Rechercher un restaurant ou un plat"
              value={searchTerm ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`
                h-11 w-full rounded-xl border bg-muted/40 pl-10 pr-4
                text-sm text-foreground placeholder:text-muted-foreground
                transition-all duration-200 ease-out
                focus:outline-none focus:bg-background focus:border-primary/40 focus:ring-2 focus:ring-primary/15
                dark:bg-muted/30 dark:focus:bg-card
                ${searchFocused ? 'border-primary/40 shadow-sm' : 'border-input'}
              `}
            />
          </div>

          {/* Actions */}
          <ThemeToggle />
          <AccountMenu />

          {/* Cart button → opens drawer */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
            <Button
              variant="ghost"
              size="icon"
              className="relative shrink-0"
              aria-label="Ouvrir le panier"
              onClick={() => setDrawerOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence mode="wait">
                {totalQty > 0 && (
                  <motion.span
                    key={totalQty}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                  >
                    {totalQty}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>

        {/* Mobile: location bar */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-2 md:hidden">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium text-foreground">Cocody, Abidjan</span>
          <button className="ml-auto text-xs font-medium text-primary" aria-label="Changer l'adresse">
            Changer
          </button>
        </div>
      </motion.header>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
