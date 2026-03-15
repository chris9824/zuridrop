'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Settings, Store, Mail, Phone, MapPin, Clock,
  Power, LogOut, Loader2, CheckCircle,
} from 'lucide-react';
import {
  getMyRestaurants, toggleRestaurantOpen,
  type Restaurant,
} from '@/lib/api/merchant';
import { clearToken, getToken } from '@/lib/api/auth';
import { useToast } from '@/components/merchant/toast';
import { cn } from '@/lib/cn';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [user, setUser] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const rests = await getMyRestaurants();
      if (rests.length > 0) setRestaurant(rests[0]);

      const token = getToken();
      if (token) {
        const res = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUser(await res.json());
      }
    } catch {
      /* graceful */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleToggle = async () => {
    if (!restaurant) return;
    setToggling(true);
    try {
      const updated = await toggleRestaurantOpen(restaurant.id);
      setRestaurant(updated);
      toast('success', updated.isOpen ? 'Restaurant ouvert' : 'Restaurant fermé');
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/merchant/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Paramètres</h1>
            <p className="text-xs text-muted-foreground">Configuration de votre restaurant</p>
          </div>
        </motion.div>

        {/* Restaurant Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-5 space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Informations restaurant</h2>

          <InfoRow icon={<Store className="h-4 w-4 text-primary" />} label="Nom" value={restaurant?.name || '—'} />
          <InfoRow icon={<MapPin className="h-4 w-4 text-orange-400" />} label="Adresse" value={restaurant?.street && restaurant?.city ? `${restaurant.street}, ${restaurant.city}` : 'Non renseignée'} />
          <InfoRow icon={<Phone className="h-4 w-4 text-blue-400" />} label="Téléphone" value={restaurant?.phone || 'Non renseigné'} />
          <InfoRow icon={<Clock className="h-4 w-4 text-cyan-400" />} label="Horaires" value={restaurant?.openingTime && restaurant?.closingTime ? `${restaurant.openingTime} – ${restaurant.closingTime}` : 'Non renseignées'} />
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-5 space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Compte</h2>
          <InfoRow icon={<Mail className="h-4 w-4 text-primary" />} label="Email" value={user?.email || '—'} />
          <InfoRow icon={<Store className="h-4 w-4 text-muted-foreground" />} label="Responsable" value={user ? `${user.firstName} ${user.lastName}` : '—'} />
        </motion.div>

        {/* Restaurant status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Statut du restaurant</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {restaurant?.isOpen
                  ? <span className="text-primary font-medium">Ouvert — Le restaurant accepte des commandes</span>
                  : <span className="text-red-400 font-medium">Fermé — Les commandes sont suspendues</span>}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggle}
              disabled={toggling}
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors',
                restaurant?.isOpen
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-primary/10 text-primary hover:bg-primary/20',
              )}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {restaurant?.isOpen ? 'Fermer' : 'Ouvrir'}
            </motion.button>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-4 text-sm font-bold text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </motion.button>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground/40">ZuriDrop Partner Platform v1.0</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
      {value !== '—' && value !== 'Non renseigné' && value !== 'Non renseignée' && value !== 'Non renseignées' && (
        <CheckCircle className="h-4 w-4 shrink-0 text-primary/30" />
      )}
    </div>
  );
}
