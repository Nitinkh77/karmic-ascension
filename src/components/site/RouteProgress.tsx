"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Global page loader: a thin gold bar at the top that starts the moment an internal link is clicked and
 * finishes when the new page has arrived. Respects reduced motion (no animation, just appears and goes).
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);

  const clear = () => {
    if (timer.current) clearInterval(timer.current);
    if (failsafe.current) clearTimeout(failsafe.current);
    timer.current = failsafe.current = null;
  };

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    clear();
    setWidth(100);
    hide.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  }, []);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    if (hide.current) clearTimeout(hide.current);
    setVisible(true);
    setWidth(8);
    // Creep towards 90% so it always looks alive, then jump to 100% when the page arrives.
    timer.current = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.12 : w)), 200);
    failsafe.current = setTimeout(finish, 12000);
  }, [finish]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page / #anchor
      start();
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clear();
    };
  }, [start]);

  // The route changed: the new page is here.
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  if (!visible) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-gold via-saffron to-gold shadow-[0_0_8px_rgb(224_122_31/0.6)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
