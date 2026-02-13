'use client';

import { motion } from 'framer-motion';
import { RestaurantCard, RestaurantCardSkeleton } from './restaurant-card';
import { useInView } from '@/lib/use-in-view';
import type { Restaurant } from '@/lib/types';

/* ── Animation variants ───────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ── Section wrapper with reveal ──────────────────── */
function RevealSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.08 });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mt-8 md:mt-10"
    >
      <h2 className="mb-4 px-4 text-xl font-semibold tracking-tight text-foreground md:px-0 md:text-2xl">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

/* ── Main component ───────────────────────────────── */
interface RestaurantGridProps {
  recommended: Restaurant[];
  all: Restaurant[];
  loading?: boolean;
}

export function RestaurantGrid({ recommended, all, loading = false }: RestaurantGridProps) {
  if (loading) {
    return (
      <>
        <section className="mt-8 md:mt-10">
          <div className="mb-4 px-4 md:px-0"><div className="h-7 w-48 animate-pulse rounded-lg bg-muted" /></div>
          <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} variant="wide" />
            ))}
          </div>
        </section>
        <section className="mt-8 md:mt-10">
          <div className="mb-4 px-4 md:px-0"><div className="h-7 w-52 animate-pulse rounded-lg bg-muted" /></div>
          <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 md:px-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} variant="compact" />
            ))}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Recommended (wide cards) */}
      {recommended.length > 0 && (
        <RevealSection title="Vous pourriez aimer">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.08 }}
            className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-0"
          >
            {recommended.map((r) => (
              <motion.div key={r.id} variants={itemVariants}>
                <RestaurantCard restaurant={r} variant="wide" />
              </motion.div>
            ))}
          </motion.div>
        </RevealSection>
      )}

      {/* All restaurants (compact grid) */}
      {all.length > 0 && (
        <RevealSection title="Tous les restaurants">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.08 }}
            className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 md:px-0"
          >
            {all.map((r) => (
              <motion.div key={r.id} variants={itemVariants}>
                <RestaurantCard restaurant={r} variant="compact" />
              </motion.div>
            ))}
          </motion.div>
        </RevealSection>
      )}
    </>
  );
}
