"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Spring fade-and-rise on scroll. Renders plain content for users who prefer reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 110, damping: 18, mass: 0.9, delay }}
    >
      {children}
    </m.div>
  );
}
