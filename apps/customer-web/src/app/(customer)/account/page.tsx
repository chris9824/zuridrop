'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  User,
  MapPin,
  ClipboardList,
  Save,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isLoggedIn } from '@/lib/api/auth';
import {
  getMe,
  updateMe,
  createAddress,
  updateAddress,
  deleteAddress,
  type UserProfile,
  type Address,
  type CreateAddressPayload,
  type UpdateAddressPayload,
} from '@/lib/api/users';
import { getMyOrders } from '@/lib/api/orders';
import type { ApiOrderDetail } from '@/lib/api/schemas';
import { OrderSummaryCard } from '@/components/orders/order-summary-card';
import { LoginForm } from '@/components/checkout/login-form';

export default function AccountPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<ApiOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setAuthChecked(true);
  }, []);

  const loadData = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [me, ords] = await Promise.all([
        getMe(),
        getMyOrders(1, 20).then((r) => r.data),
      ]);
      setProfile(me);
      setAddresses(me.addresses ?? []);
      setOrders(ords);
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        setAuthenticated(false);
      } else {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const showLogin = authChecked && !authenticated;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Link>
          <h1 className="text-base font-semibold text-foreground">Mon compte</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {showLogin && (
          <div className="mx-auto max-w-md">
            <LoginForm
              onSuccess={() => setAuthenticated(true)}
              title="Connectez-vous"
              description="Connectez-vous pour gérer votre compte."
            />
          </div>
        )}

        {authenticated && loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}

        {authenticated && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {authenticated && !loading && profile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <PersonalInfoSection profile={profile} onSaved={() => loadData()} />
            <AddressSection addresses={addresses} defaultAddressId={profile.defaultAddressId ?? null} onUpdated={() => loadData()} />
            <OrderHistorySection orders={orders} />
          </motion.div>
        )}
      </main>
    </div>
  );
}

function PersonalInfoSection({ profile, onSaved }: { profile: UserProfile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  });

  useEffect(() => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        avatarUrl: form.avatarUrl || undefined,
      });
      setToast('Profil mis à jour');
      setEditing(false);
      onSaved();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <User className="h-4 w-4 text-primary" />
          Informations personnelles
        </h2>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
              Annuler
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {toast && (
        <div className="mb-4 rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
          {toast}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Prénom</label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom</label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              disabled={!editing}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
          <Input value={form.email} disabled className="bg-muted/50" />
          <p className="mt-1 text-[10px] text-muted-foreground">L&apos;email ne peut pas être modifié.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Téléphone</label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            disabled={!editing}
            placeholder="+225 01 02 03 04 05"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Photo (URL)</label>
          <Input
            value={form.avatarUrl}
            onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
            disabled={!editing}
            placeholder="https://..."
          />
        </div>
      </div>
    </section>
  );
}

const ADDRESS_TYPES = ['Maison', 'Bureau', 'Autre'] as const;

function AddressSection({ addresses, defaultAddressId, onUpdated }: { addresses: Address[]; defaultAddressId: string | null; onUpdated: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateAddressPayload & { label: string }>({
    label: 'Maison',
    street: '',
    city: '',
    zipCode: '',
    country: "Côte d'Ivoire",
  });
  const [newAddr, setNewAddr] = useState<CreateAddressPayload>({
    label: 'Maison',
    street: '',
    city: '',
    zipCode: '',
    country: "Côte d'Ivoire",
  });
  const [saving, setSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleSetDefault = async (addrId: string) => {
    setSettingDefaultId(addrId);
    try {
      await updateMe({ defaultAddressId: addrId });
      onUpdated();
    } catch {
      // ignore
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleAdd = async () => {
    if (!newAddr.street.trim() || !newAddr.city.trim()) return;
    setSaving(true);
    setAddressError(null);
    try {
      await createAddress(newAddr);
      setNewAddr({ label: 'Maison', street: '', city: '', zipCode: '', country: "Côte d'Ivoire" });
      setAdding(false);
      onUpdated();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Impossible d\'ajouter cette adresse');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setEditForm({
      label: ADDRESS_TYPES.includes(addr.label as (typeof ADDRESS_TYPES)[number]) ? addr.label : 'Autre',
      street: addr.street,
      city: addr.city,
      zipCode: addr.zipCode ?? '',
      country: addr.country ?? "Côte d'Ivoire",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.street?.trim() || !editForm.city?.trim()) return;
    setSaving(true);
    setAddressError(null);
    try {
      await updateAddress(editingId, {
        label: editForm.label,
        street: editForm.street,
        city: editForm.city,
        zipCode: editForm.zipCode || undefined,
        country: editForm.country,
      });
      setEditingId(null);
      onUpdated();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Impossible de modifier cette adresse');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => { setEditingId(null); setAddressError(null); };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAddress(id);
      onUpdated();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Mes adresses
        </h2>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        )}
      </div>

      {addressError && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {addressError}
          <button
            type="button"
            onClick={() => setAddressError(null)}
            className="ml-auto rounded p-1 hover:bg-destructive/20"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {adding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Type d&apos;adresse</label>
            <select
              value={newAddr.label ?? 'Maison'}
              onChange={(e) => setNewAddr((p) => ({ ...p, label: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {ADDRESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Input
            placeholder="Rue"
            value={newAddr.street}
            onChange={(e) => setNewAddr((p) => ({ ...p, street: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Ville"
              value={newAddr.city}
              onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
            />
            <Input
              placeholder="Code postal"
              value={newAddr.zipCode ?? ''}
              onChange={(e) => setNewAddr((p) => ({ ...p, zipCode: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !newAddr.street.trim() || !newAddr.city.trim()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Enregistrer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setAddressError(null); }}>
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {addresses.length === 0 && !adding && (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucune adresse enregistrée.</p>
        )}
        {addresses.map((addr) =>
          editingId === addr.id ? (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type d&apos;adresse</label>
                <select
                  value={editForm.label}
                  onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {ADDRESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="Rue"
                value={editForm.street}
                onChange={(e) => setEditForm((p) => ({ ...p, street: e.target.value }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Ville"
                  value={editForm.city}
                  onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                />
                <Input
                  placeholder="Code postal"
                  value={editForm.zipCode ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, zipCode: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editForm.street?.trim() || !editForm.city?.trim()}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Enregistrer
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Annuler
                </Button>
              </div>
            </motion.div>
          ) : (
            <div
              key={addr.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{addr.label}</p>
                  {defaultAddressId === addr.id && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <Star className="h-3 w-3 fill-current" />
                      Par défaut
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {addr.street}, {addr.city}
                  {addr.zipCode && ` ${addr.zipCode}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {defaultAddressId !== addr.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={settingDefaultId === addr.id}
                  >
                    {settingDefaultId === addr.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                    Défaut
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-accent"
                  onClick={() => handleEdit(addr)}
                  disabled={!!editingId}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                >
                  {deletingId === addr.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function OrderHistorySection({ orders }: { orders: ApiOrderDetail[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          Historique des commandes
        </h2>
        <Link href="/orders">
          <Button variant="outline" size="sm">
            Voir tout
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {orders.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucune commande passée.</p>
        )}
        {orders.slice(0, 5).map((order) => (
          <OrderSummaryCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
