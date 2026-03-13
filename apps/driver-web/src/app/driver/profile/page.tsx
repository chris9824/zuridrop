'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Mail, Shield, Truck } from 'lucide-react';
import { isLoggedIn, clearToken } from '@/lib/api/auth';
import { getMe, type DriverAvailability } from '@/lib/api/driver';
import { BottomNav } from '@/components/driver/bottom-nav';
import { cn } from '@/lib/cn';

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  availability: DriverAvailability;
}

export default function DriverProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/driver/login');
      return;
    }
    getMe()
      .then(setProfile)
      .catch(() => router.push('/driver/login'));
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push('/driver/login');
  };

  if (!profile) return null;

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-[15px] font-bold text-foreground">Profil</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-3xl border border-white/[0.06] bg-card p-6"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {initials}
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">
            {profile.firstName} {profile.lastName}
          </h2>
          <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            Livreur ZuriDrop
          </span>
        </motion.div>

        {/* Info cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-card p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-[11px] text-muted-foreground">Email</div>
              <div className="text-sm font-medium text-foreground">{profile.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-card p-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-[11px] text-muted-foreground">Rôle</div>
              <div className="text-sm font-medium text-foreground">Driver</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-card p-4">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                profile.availability === 'AVAILABLE'
                  ? 'bg-primary'
                  : profile.availability === 'BUSY'
                    ? 'bg-amber-500'
                    : 'bg-muted-foreground/30',
              )}
            />
            <div>
              <div className="text-[11px] text-muted-foreground">Statut</div>
              <div className="text-sm font-medium text-foreground">
                {profile.availability === 'AVAILABLE'
                  ? 'En ligne'
                  : profile.availability === 'BUSY'
                    ? 'En course'
                    : 'Hors ligne'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-semibold text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </motion.button>

        <p className="text-center text-[11px] text-muted-foreground/40">ZuriDrop Driver v1.0</p>
      </main>

      <BottomNav />
    </div>
  );
}
