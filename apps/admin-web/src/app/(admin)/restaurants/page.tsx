'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, Store } from 'lucide-react';
import { getAdminRestaurants } from '@/lib/api/admin';
import type { AdminRestaurant } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

export default function AdminRestaurantsPage() {
  const [data, setData] = useState<AdminRestaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    getAdminRestaurants({ page, limit: 20, q: search || undefined })
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} restaurant{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-48 rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Rechercher
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <Store className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Aucun restaurant</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Cuisine</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Téléphone</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Ville</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Statut</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Commandes</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Revenu</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.cuisineType ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          r.isOpen
                            ? 'bg-green-500/15 text-green-600'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {r.isOpen ? 'Ouvert' : 'Fermé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {r.ordersCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {r.revenue.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
