'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { getAdminOrders } from '@/lib/api/admin';
import type { AdminOrder } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  PREPARING: 'En préparation',
  READY_FOR_PICKUP: 'Prête',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchOrders = (overrides?: { page?: number }) => {
    const p = overrides?.page ?? page;
    setLoading(true);
    getAdminOrders({ page: p, limit: 20, status: status || undefined, q: search || undefined })
      .then((res) => {
        setOrders(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders({ page: 1 });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commandes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} commande{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
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
            Filtrer
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Aucune commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-foreground">N°</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Restaurant</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Driver</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Statut</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Paiement</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      #{o.id.slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {o.customer.firstName} {o.customer.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{o.customer.email}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{o.restaurant.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.delivery?.driver
                        ? `${o.delivery.driver.firstName} ${o.delivery.driver.lastName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          o.status === 'DELIVERED' && 'bg-green-500/15 text-green-600',
                          o.status === 'CANCELLED' && 'bg-destructive/15 text-destructive',
                          !['DELIVERED', 'CANCELLED'].includes(o.status) &&
                            'bg-primary/15 text-primary',
                        )}
                      >
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {o.total.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.paymentMethod}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString('fr-FR')}
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
