'use client';

import { useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';

export function useLandingMotion() {
  const reduced = useReducedMotion() ?? false;

  const fadeUpVariants: Variants = reduced
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, delay: i * 0.08 },
        }),
      };

  return {
    reduced,
    fadeUp: (delay = 0) =>
      reduced
        ? ({ initial: false } as const)
        : {
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay } satisfies Transition,
          },
    fadeUpSmall: (delay = 0) =>
      reduced
        ? ({ initial: false } as const)
        : {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay } satisfies Transition,
          },
    whileInView: (delay = 0) =>
      reduced
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay } satisfies Transition,
            viewport: { once: true },
          },
    fadeUpVariants,
    navEnter: reduced
      ? {}
      : {
          initial: { y: -100 },
          animate: { y: 0 },
          transition: { duration: 0.5 } satisfies Transition,
        },
    mockupEnter: reduced
      ? ({ initial: false } as const)
      : {
          initial: { opacity: 0, y: 40 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay: 0.4 } satisfies Transition,
        },
  };
}
