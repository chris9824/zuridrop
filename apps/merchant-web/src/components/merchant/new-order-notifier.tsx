'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { getIncomingOrders, type Order } from '@/lib/api/merchant';
import { detectNewOrderIds } from '@/lib/order-utils';
import { useToast } from '@/components/merchant/toast';
import { usePolling } from '@/hooks/use-polling';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/cn';

const SOUND_KEY = 'zuridrop-merchant-sound';

function getSoundPref(): boolean {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v !== 'off';
  } catch {
    return true;
  }
}

function setSoundPref(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch { /* ignore */ }
}

export function NewOrderNotifier() {
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPending = useRef<Order[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    setSoundEnabled(getSoundPref());
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      setSoundPref(next);
      return next;
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const inc = await getIncomingOrders();
      const newPending = inc.data;

      if (initialized.current) {
        const newIds = detectNewOrderIds(prevPending.current, newPending);
        if (newIds.length > 0) {
          if (soundEnabled) {
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 1;
              audio.play().catch(() => {});
            } catch { /* audio not available */ }
          }
          toast(
            'info',
            newIds.length === 1
              ? 'Nouvelle commande reçue !'
              : `${newIds.length} nouvelles commandes reçues !`,
          );
        }
      }
      initialized.current = true;
      prevPending.current = newPending;
    } catch {
      /* graceful */
    }
  }, [soundEnabled, toast]);

  useEffect(() => { poll(); }, [poll]);
  usePolling(poll, 5000);

  return (
    <button
      onClick={toggleSound}
      className={cn(
        'rounded-xl p-2 transition-colors',
        soundEnabled
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground hover:text-foreground',
      )}
      title={soundEnabled ? 'Désactiver les notifications sonores' : 'Activer les notifications sonores'}
    >
      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}
