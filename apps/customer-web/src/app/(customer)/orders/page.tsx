'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { isLoggedIn } from '@/lib/api/auth';
import { getMyOrders } from '@/lib/api/orders';
import type { ApiOrderDetail } from '@/lib/api/schemas';
import { OrderSummaryCard } from '@/components/orders/order-summary-card';
import { OrdersEmptyState } from '@/components/orders/orders-empty-state';
import { LoginForm } from '@/components/checkout/login-form';

export default function OrdersListPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<ApiOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setAuthChecked(true);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrders(1, 50);
      setOrders(res.data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AuthRequiredError') {
        setAuthenticated(false);
      } else {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadOrders();
  }, [authenticated, loadOrders]);

  const showLogin = authChecked && !authenticated;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Link>
          <h1 className="text-base font-semibold text-foreground">Mes commandes</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Login required */}
        {showLogin && (
          <div className="mx-auto max-w-md">
            <LoginForm
              onSuccess={() => setAuthenticated(true)}
              title="Connectez-vous pour voir vos commandes"
              description="Veuillez vous connecter pour accéder à vos commandes."
            />
          </div>
        )}

        {/* Loading */}
        {authenticated && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {authenticated && !loading && error && (
          <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vérifiez que le backend est lancé.
            </p>
          </div>
        )}

        {/* Empty */}
        {authenticated && !loading && !error && orders.length === 0 && (
          <OrdersEmptyState />
        )}

        {/* Orders list */}
        {authenticated && !loading && !error && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <OrderSummaryCard order={order} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
