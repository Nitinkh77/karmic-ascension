"use client";

import { useEffect } from "react";

/**
 * Lenis smooth scrolling, loaded lazily after the page is interactive.
 * Skipped for visitors who prefer reduced motion. Touch devices keep native scrolling (Lenis default).
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let destroy: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      const loop = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      destroy = () => lenis.destroy();
    };

    // Wait for an idle moment so it never competes with first paint.
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const handle = idle ? idle(() => void start()) : window.setTimeout(() => void start(), 600);

    return () => {
      cancelled = true;
      if (!idle) window.clearTimeout(handle);
      cancelAnimationFrame(raf);
      destroy?.();
    };
  }, []);

  return null;
}
