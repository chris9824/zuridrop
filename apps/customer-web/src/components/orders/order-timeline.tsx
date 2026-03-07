'use client';

import {
  Check,
  Circle,
  X,
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Bike,
  Truck,
  PartyPopper,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TIMELINE_STEPS, getStatusConfig } from '@/lib/order-status';
import type { StatusConfig } from '@/lib/order-status';

interface OrderTimelineProps {
  currentStatus: string;
}

const STEP_ICONS: Record<StatusConfig['icon'], typeof Clock> = {
  'clock': Clock,
  'check-circle': CheckCircle2,
  'chef-hat': ChefHat,
  'package': Package,
  'bike': Bike,
  'truck': Truck,
  'party': PartyPopper,
  'x-circle': X,
};

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'CANCELLED';
  const currentStep = getStatusConfig(currentStatus).step;

  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-950/30"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/25">
          <X className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-red-800 dark:text-red-300">
            Commande annulée
          </p>
          <p className="mt-0.5 text-sm text-red-700/80 dark:text-red-400/80">
            Cette commande a été annulée. Vous pouvez en passer une nouvelle.
          </p>
        </div>
      </motion.div>
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
        const StepIcon = STEP_ICONS[config.icon] ?? Circle;

        return (
          <motion.div
            key={statusKey}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-4"
          >
            {/* Connector column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  isActive ? 'h-10 w-10' : 'h-8 w-8',
                  isCompleted && 'border-green-500 bg-green-500 shadow-sm shadow-green-500/20',
                  isActive && 'border-primary bg-primary shadow-lg shadow-primary/30',
                  isPending && 'border-border bg-muted/60',
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : isActive ? (
                  <StepIcon className="h-5 w-5 text-white" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5 text-muted-foreground/30" />
                )}
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[28px]',
                    isCompleted ? 'bg-green-500' : 'bg-border',
                  )}
                />
              )}
            </div>

            {/* Label + description */}
            <div className={cn('pb-7', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  isActive ? 'leading-10' : 'leading-8',
                  isCompleted && 'text-green-700 dark:text-green-400',
                  isActive && 'text-foreground font-bold text-base',
                  isPending && 'text-muted-foreground/60',
                )}
              >
                {config.label}
              </p>
              {isActive && (
                <p className="-mt-1 text-sm text-muted-foreground">
                  {config.message}
                </p>
              )}
              {isCompleted && (
                <p className="text-xs text-green-600/60 dark:text-green-500/50">
                  Terminé
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
