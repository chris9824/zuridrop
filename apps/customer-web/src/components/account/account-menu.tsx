'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isLoggedIn, clearToken } from '@/lib/api/auth';

export function AccountMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleLogout = useCallback(() => {
    clearToken();
    setOpen(false);
    setAuthenticated(false);
    router.push('/');
    router.refresh();
  }, [router]);

  const handleLogin = useCallback(() => {
    setOpen(false);
    const from = pathname === '/checkout' ? '' : `?from=${encodeURIComponent(pathname)}`;
    router.push(`/checkout${from}`);
  }, [router, pathname]);

  return (
    <div ref={menuRef} className="relative">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Menu du compte"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <User className="h-5 w-5" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {authenticated ? (
              <>
                <button
                  onClick={() => { setOpen(false); router.push('/account/addresses'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Mes adresses
                </button>
                <div className="border-t border-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/5"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <LogIn className="h-4 w-4 text-primary" />
                Se connecter
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
