'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  index?: number;
}

export function StatsCard({ icon, label, value, hint, accent = 'text-primary', index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-white/[0.06] bg-card p-4"
    >
      <div className={cn('mb-2', accent)}>{icon}</div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && (
        <div className="mt-1 text-[10px] leading-tight text-muted-foreground/60">{hint}</div>
      )}
    </motion.div>
  );
}
