"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Loads framer-motion's features lazily and honours the visitor's "reduce motion" OS setting. */
const loadFeatures = () => import("@/components/site/motionFeatures").then((m) => m.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
