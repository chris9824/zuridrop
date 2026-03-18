'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User, Store, Save, Loader2, Clock, MapPin, Phone,
  UtensilsCrossed, Image as ImageIcon,
} from 'lucide-react';
import {
  getMerchantProfile,
  updateMerchantProfile,
  type MerchantProfile,
  type UpdateMerchantProfilePayload,
} from '@/lib/api/merchant';
import { useToast } from '@/components/merchant/toast';
import { cn } from '@/lib/cn';

export default function MerchantProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateMerchantProfilePayload>({});

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getMerchantProfile();
      setProfile(data);
      if (data.restaurant) {
        setForm({
          name: data.restaurant.name,
          description: data.restaurant.description ?? undefined,
          cuisineType: data.restaurant.cuisineType ?? undefined,
          phone: data.restaurant.phone ?? undefined,
          street: data.restaurant.street ?? undefined,
          city: data.restaurant.city ?? undefined,
          imageUrl: data.restaurant.imageUrl ?? undefined,
          preparationTimeMinutes: data.restaurant.preparationTimeMinutes ?? undefined,
          openingTime: data.restaurant.openingTime ?? undefined,
          closingTime: data.restaurant.closingTime ?? undefined,
          isOpen: data.restaurant.isOpen,
        });
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMerchantProfile(form);
      setProfile(updated);
      toast('success', 'Profil mis à jour');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!profile?.restaurant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Aucun restaurant associé. Créez d&apos;abord un restaurant.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Profil merchant</h1>
              <p className="text-xs text-muted-foreground">Informations de votre restaurant</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </motion.button>
        </motion.div>

        {/* Restaurant info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-5 space-y-4"
        >
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Store className="h-4 w-4" />
            Informations restaurant
          </h2>

          <FormField
            label="Nom"
            value={form.name ?? ''}
            onChange={(v) => setForm((p) => ({ ...p, name: v }))}
            placeholder="Nom du restaurant"
          />
          <FormField
            label="Description"
            value={form.description ?? ''}
            onChange={(v) => setForm((p) => ({ ...p, description: v }))}
            placeholder="Description courte"
          />
          <FormField
            label="Type de cuisine"
            value={form.cuisineType ?? ''}
            onChange={(v) => setForm((p) => ({ ...p, cuisineType: v }))}
            placeholder="Ex: Ivoirienne, Fast-food"
          />
          <FormField
            label="Téléphone"
            value={form.phone ?? ''}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
            placeholder="+225 01 02 03 04 05"
          />
          <FormField
            label="Adresse (rue)"
            value={form.street ?? ''}
            onChange={(v) => setForm((p) => ({ ...p, street: v }))}
            placeholder="Rue, numéro"
          />
          <FormField
            label="Ville"
            value={form.city ?? ''}
            onChange={(v) => setForm((p) => ({ ...p, city: v }))}
            placeholder="Abidjan"
          />
          <FormField
            label="Logo (URL)"
            value={form.imageUrl ?? ''}
            onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
            placeholder="https://..."
          />
        </motion.div>

        {/* Paramètres opérationnels */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-5 space-y-4"
        >
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Clock className="h-4 w-4" />
            Paramètres opérationnels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Heure d&apos;ouverture
              </label>
              <input
                type="time"
                value={form.openingTime ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, openingTime: e.target.value || undefined }))}
                className={cn(
                  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Heure de fermeture
              </label>
              <input
                type="time"
                value={form.closingTime ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, closingTime: e.target.value || undefined }))}
                className={cn(
                  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isOpen"
              checked={form.isOpen ?? false}
              onChange={(e) => setForm((p) => ({ ...p, isOpen: e.target.checked }))}
              className="h-4 w-4 rounded border-input bg-background"
            />
            <label htmlFor="isOpen" className="text-sm font-medium text-foreground">
              Restaurant ouvert actuellement
            </label>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Temps de préparation moyen (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={form.preparationTimeMinutes ?? ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  preparationTimeMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
                }))
              }
              className={cn(
                'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
              placeholder="15"
            />
          </div>
        </motion.div>

        {/* User info (read-only) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-card p-5"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Compte</h2>
          <div className="space-y-2 text-sm">
            <p className="text-foreground">
              <span className="text-muted-foreground">Responsable :</span>{' '}
              {profile.user.firstName} {profile.user.lastName}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Email :</span> {profile.user.email}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      />
    </div>
  );
}
