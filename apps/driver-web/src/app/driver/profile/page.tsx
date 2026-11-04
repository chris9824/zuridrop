'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LogOut, Mail, Truck, User, Phone, Save, Loader2,
  Car, Hash, Power, Package, DollarSign, Star, MessageSquare,
} from 'lucide-react';
import { isLoggedIn, clearToken } from '@/lib/api/auth';
import { getMe, updateDriverProfile, setAvailability, getHistory, getMyDriverSummary, getMyDriverReviews, type DriverProfile, type DriverReviewSummary, type DriverReview } from '@/lib/api/driver';
import { BottomNav } from '@/components/driver/bottom-nav';
import { useToast } from '@/components/driver/toast';
import { cn } from '@/lib/cn';

export default function DriverProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [stats, setStats] = useState<{ deliveriesCount: number; totalEarnings: number } | null>(null);
  const [reviewSummary, setReviewSummary] = useState<DriverReviewSummary | null>(null);
  const [recentReviews, setRecentReviews] = useState<DriverReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
    vehicleType: '',
    plateNumber: '',
  });

  const fetchProfile = useCallback(async () => {
    if (!isLoggedIn()) {
      router.push('/driver/login');
      return;
    }
    try {
      // Utiliser getMe (users/me) qui fonctionne sur le dashboard, plutôt que getDriverProfile
      // pour éviter les déconnexions inexpliquées sur la page profil
      const [me, history, summaryRes, reviewsRes] = await Promise.all([
        getMe(),
        getHistory().catch(() => []),
        getMyDriverSummary().catch(() => null),
        getMyDriverReviews(1, 5).catch(() => null),
      ]);
      const delivered = Array.isArray(history) ? history.filter((d: { status: string }) => d.status === 'DELIVERED') : [];
      setStats({
        deliveriesCount: delivered.length,
        totalEarnings: delivered.reduce((sum: number, d: { deliveryFee: number }) => sum + (d.deliveryFee ?? 0), 0),
      });
      setReviewSummary(summaryRes);
      setRecentReviews(reviewsRes?.data ?? []);
      const data: DriverProfile = {
        id: me.id,
        email: me.email,
        firstName: me.firstName,
        lastName: me.lastName,
        phone: me.phone ?? undefined,
        avatarUrl: me.avatarUrl ?? undefined,
        vehicleType: me.vehicleType ?? undefined,
        plateNumber: me.plateNumber ?? undefined,
        isOnline: me.isOnline,
        availability: me.availability,
      };
      setProfile(data);
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? '',
        avatarUrl: data.avatarUrl ?? '',
        vehicleType: data.vehicleType ?? '',
        plateNumber: data.plateNumber ?? '',
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        clearToken();
        router.push('/driver/login');
      } else {
        toast('error', err instanceof Error ? err.message : 'Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await updateDriverProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        avatarUrl: form.avatarUrl || undefined,
        vehicleType: form.vehicleType || undefined,
        plateNumber: form.plateNumber || undefined,
      });
      setProfile(updated);
      setEditing(false);
      toast('success', 'Profil mis à jour');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOnline = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const next = profile.isOnline ? 'OFFLINE' : 'AVAILABLE';
      const res = await setAvailability(next);
      setProfile((p) => (p ? { ...p, isOnline: res.isOnline, availability: res.availability } : null));
      toast('success', res.isOnline ? 'Vous êtes en ligne' : 'Vous êtes hors ligne');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/driver/login');
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  const initials = `${profile.firstName[0] || ''}${profile.lastName[0] || ''}`.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-[15px] font-bold text-foreground">Profil</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium text-primary"
            >
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 text-sm font-medium text-primary"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Enregistrer
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-3xl border border-white/[0.06] bg-card p-6"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {initials}
            </div>
          )}
          <h2 className="mt-3 text-lg font-bold text-foreground">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Prénom"
                  className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm"
                />
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Nom"
                  className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm"
                />
              </div>
            ) : (
              `${profile.firstName} ${profile.lastName}`
            )}
          </h2>
          <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            Livreur ZuriDrop
          </span>
        </motion.div>

        {/* Availability toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-3 w-3 rounded-full',
                  profile.isOnline ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
              <div>
                <div className="text-[11px] text-muted-foreground">Disponibilité</div>
                <div className="text-sm font-medium text-foreground">
                  {profile.isOnline ? 'En ligne' : 'Hors ligne'}
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleOnline}
              disabled={toggling || profile.availability === 'BUSY'}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold',
                profile.isOnline
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-primary/10 text-primary',
              )}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {profile.isOnline ? 'Passer hors ligne' : 'Passer en ligne'}
            </motion.button>
          </div>
        </motion.div>

        {/* Résumé activité */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="rounded-2xl border border-white/[0.06] bg-card p-4"
          >
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              Résumé activité
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span className="text-[11px]">Livraisons</span>
                </div>
                <div className="mt-1 text-lg font-bold text-foreground">{stats.deliveriesCount}</div>
              </div>
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-[11px]">Gains</span>
                </div>
                <div className="mt-1 text-lg font-bold text-foreground">
                  {stats.totalEarnings.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Réputation (avis clients) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.035 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-4"
        >
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            Réputation
          </h3>
          {reviewSummary && reviewSummary.reviewCount > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-bold text-foreground">
                    {reviewSummary.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviewSummary.reviewCount} avis)
                </span>
              </div>
              {recentReviews.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-muted-foreground">Derniers avis</p>
                  {recentReviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm">
                          {'★'.repeat(Math.round(r.rating))}{'☆'.repeat(5 - Math.round(r.rating))}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {r.customer?.firstName || r.customer?.lastName
                            ? `${r.customer.firstName ?? ''} ${r.customer.lastName ?? ''}`.trim()
                            : 'Client'}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-1 text-sm text-foreground">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Pas encore d&apos;avis</p>
              <p className="text-[11px] text-muted-foreground/60">
                Les avis de vos clients apparaîtront ici après les livraisons
              </p>
            </div>
          )}
        </motion.div>

        {/* Driver info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="space-y-2"
        >
          <h3 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Informations personnelles
          </h3>
          <div className="rounded-2xl border border-white/[0.06] bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground">Email</div>
                <div className="text-sm font-medium text-foreground">{profile.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground">Téléphone</div>
                {editing ? (
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+225 07 12 34 56 78"
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                  />
                ) : (
                  <div className="text-sm font-medium text-foreground">{profile.phone || '—'}</div>
                )}
              </div>
            </div>
            {editing && (
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">Photo (URL)</div>
                <input
                  value={form.avatarUrl}
                  onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Vehicle info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="space-y-2"
        >
          <h3 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Car className="h-3.5 w-3.5" />
            Véhicule
          </h3>
          <div className="rounded-2xl border border-white/[0.06] bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground">Type</div>
                {editing ? (
                  <input
                    value={form.vehicleType}
                    onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}
                    placeholder="Moto, Voiture..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                  />
                ) : (
                  <div className="text-sm font-medium text-foreground">{profile.vehicleType || '—'}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground">Immatriculation</div>
                {editing ? (
                  <input
                    value={form.plateNumber}
                    onChange={(e) => setForm((p) => ({ ...p, plateNumber: e.target.value }))}
                    placeholder="AB-1234-CI"
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                  />
                ) : (
                  <div className="text-sm font-medium text-foreground">{profile.plateNumber || '—'}</div>
                )}
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
