'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed, Plus, Loader2, Search, X,
} from 'lucide-react';
import {
  getMyRestaurants, createMenuItem,
  type Restaurant, type MenuItem,
} from '@/lib/api/merchant';
import { MenuItemCard } from '@/components/merchant/menu-item-card';
import { EmptyState } from '@/components/merchant/empty-state';
import { useToast } from '@/components/merchant/toast';
import { cn } from '@/lib/cn';

export default function MenuPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const rests = await getMyRestaurants();
      if (rests.length > 0) {
        setRestaurant(rests[0]);
        setItems(rests[0].menuItems || []);
      }
    } catch {
      /* graceful */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];

  const filtered = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && item.category !== category) return false;
    return true;
  });

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Menu</h1>
              <p className="text-xs text-muted-foreground">{items.length} article{items.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </motion.button>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full rounded-xl border border-white/[0.06] bg-card py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary/40"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto">
              <button
                onClick={() => setCategory(null)}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  !category ? 'bg-primary/10 text-primary' : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                Tout
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? null : cat)}
                  className={cn(
                    'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    cat === category ? 'bg-primary/10 text-primary' : 'bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Aucun résultat' : 'Aucun article'}
            description={search ? `Pas d'article correspondant à "${search}".` : 'Ajoutez votre premier article au menu.'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, i) => (
              <MenuItemCard key={item.id} item={item} index={i} onUpdated={fetch} />
            ))}
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAdd && restaurant && (
            <AddItemModal
              restaurantId={restaurant.id}
              onClose={() => setShowAdd(false)}
              onCreated={() => { setShowAdd(false); fetch(); }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Add Item Modal ────────────────────────────── */

function AddItemModal({ restaurantId, onClose, onCreated }: { restaurantId: string; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setSaving(true);
    try {
      await createMenuItem({
        restaurantId,
        name,
        price: Number(price),
        description: desc || undefined,
        category: cat || undefined,
      });
      toast('success', 'Article ajouté');
      onCreated();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.06] bg-card p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Nouvel article</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'article *" required className="w-full rounded-xl border border-white/[0.06] bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/40" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prix (ex: 1500) *" required type="number" className="w-full rounded-xl border border-white/[0.06] bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/40" />
          <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Catégorie (ex: Plats)" className="w-full rounded-xl border border-white/[0.06] bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/40" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optionnel)" rows={2} className="w-full rounded-xl border border-white/[0.06] bg-background px-4 py-3 text-sm text-foreground outline-none resize-none focus:border-primary/40" />
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Créer l&apos;article
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
