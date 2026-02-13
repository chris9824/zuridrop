'use client';

import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  once?: boolean;
  rootMargin?: string;
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
) {
  const { threshold = 0.1, once = true, rootMargin = '0px' } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion: immediately set inView
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, inView };
}
