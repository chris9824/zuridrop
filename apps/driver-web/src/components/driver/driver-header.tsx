'use client';

import { Truck } from 'lucide-react';

interface Props {
  driverName: string;
}

export function DriverHeader({ driverName }: Props) {
  const initials = driverName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initials || <Truck className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-[15px] font-bold text-foreground">{driverName}</div>
            <div className="text-[11px] font-medium text-muted-foreground">ZuriDrop Driver</div>
          </div>
        </div>
        <div className="flex h-8 items-center rounded-full bg-card px-3">
          <Truck className="mr-1.5 h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-muted-foreground">v1.0</span>
        </div>
      </div>
    </header>
  );
}
