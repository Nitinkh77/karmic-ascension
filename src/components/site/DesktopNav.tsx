"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

/** Desktop navigation with a pill that springs to the active (or hovered) link. */
export function DesktopNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)),
    [pathname],
  );

  const moveTo = useCallback((el: HTMLElement | null) => {
    if (!el) return setPill(null);
    setPill({ x: el.offsetLeft, w: el.offsetWidth });
  }, []);

  const toActive = useCallback(() => {
    const link = listRef.current?.querySelector<HTMLElement>("a[aria-current='page']") ?? null;
    moveTo(link?.parentElement ?? null); // measure the <li>, which is positioned relative to the list
  }, [moveTo]);

  // Place the pill under the active link without animating on first paint.
  useLayoutEffect(() => {
    toActive();
  }, [toActive, pathname]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    const onResize = () => toActive();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
  }, [toActive]);

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
      <ul ref={listRef} className="relative flex items-center" onMouseLeave={toActive}>
        <li
          aria-hidden="true"
          className={cn("absolute left-0 top-0 h-full rounded-full bg-parchment", pill ? "opacity-100" : "opacity-0")}
          style={{
            width: pill?.w ?? 0,
            transform: `translateX(${pill?.x ?? 0}px)`,
            transition: animate
              ? "transform 0.5s var(--ease-spring), width 0.5s var(--ease-spring), opacity 0.2s"
              : "none",
          }}
        />
        {links.map((l) => (
          <li key={l.href} className="relative">
            <Link
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              onMouseEnter={(e) => moveTo(e.currentTarget.parentElement)}
              onFocus={(e) => moveTo(e.currentTarget.parentElement)}
              onBlur={toActive}
              className="relative block rounded-full px-3.5 py-2 text-sm font-medium text-charcoal transition-colors hover:text-maroon aria-[current=page]:font-semibold aria-[current=page]:text-maroon"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <ButtonLink href="/book" size="md" className="ml-3">
        Book a session
      </ButtonLink>
    </nav>
  );
}
