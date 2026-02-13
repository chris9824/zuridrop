'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;

  return (
    <div className="min-h-screen bg-background">
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
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <CheckCircle className="h-20 w-20 text-green-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Commande confirmée !
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre commande a bien été enregistrée.
          </p>
        </motion.div>

        {/* Order ID */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card px-6 py-4"
        >
          <p className="text-xs text-muted-foreground">Numéro de commande</p>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground">
            {orderId}
          </p>
        </motion.div>

        {/* Status info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-3"
        >
          <Clock className="h-4 w-4 text-primary" />
          <p className="text-sm text-foreground">
            Le restaurant va bientôt préparer votre commande.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3"
        >
          <Link href="/">
            <Button variant="outline">Retour à l&apos;accueil</Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
