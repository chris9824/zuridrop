'use client';

import { Check, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMELINE_STEPS, getStatusConfig } from '@/lib/order-status';

interface OrderTimelineProps {
  currentStatus: string;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'CANCELLED';
  const currentStep = getStatusConfig(currentStatus).step;

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/30">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500">
          <X className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            Commande annulée
          </p>
          <p className="text-xs text-red-700 dark:text-red-400">
            Cette commande a été annulée.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((statusKey, index) => {
        const config = getStatusConfig(statusKey);
        const isCompleted = config.step < currentStep;
        const isActive = config.step === currentStep;
        const isPending = config.step > currentStep;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <div key={statusKey} className="flex gap-3">
            {/* Connector column */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted && 'border-green-500 bg-green-500',
                  isActive && 'border-primary bg-primary shadow-md shadow-primary/25',
                  isPending && 'border-border bg-muted',
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : isActive ? (
                  <Circle className="h-3 w-3 fill-white text-white" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground/30" />
                )}
              </div>

              {/* Line */}
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[24px]',
                    isCompleted ? 'bg-green-500' : 'bg-border',
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium leading-8',
                  isCompleted && 'text-green-700 dark:text-green-400',
                  isActive && 'text-foreground font-semibold',
                  isPending && 'text-muted-foreground',
                )}
              >
                {config.label}
              </p>
              {isActive && (
                <p className="text-xs text-muted-foreground">{config.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
