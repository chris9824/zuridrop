'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OrdersEmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <ShoppingBag className="h-9 w-9 text-muted-foreground/40" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Vous n&apos;avez encore aucune commande
      </h2>
      <p className="text-sm text-muted-foreground">
        Découvrez nos restaurants et passez votre première commande.
      </p>
      <Link href="/">
        <Button className="mt-2">Explorer les restaurants</Button>
      </Link>
    </div>
  );
}
