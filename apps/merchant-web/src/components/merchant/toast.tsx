'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X, Bell } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string }
interface ToastContextValue { toast: (type: ToastType, message: string) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
export function useToast() { return useContext(ToastContext); }

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl',
                t.type === 'success' && 'border-primary/20 bg-card/95 text-primary',
                t.type === 'error' && 'border-red-500/20 bg-card/95 text-red-400',
                t.type === 'info' && 'border-amber-500/20 bg-card/95 text-amber-400',
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
              {t.type === 'error' && <XCircle className="h-5 w-5 shrink-0" />}
              {t.type === 'info' && <Bell className="h-5 w-5 shrink-0" />}
              <span className="flex-1 text-sm font-medium text-foreground">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
