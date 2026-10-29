"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavItem } from "@/components/site/Header";

/**
 * Desktop menu with a sliding highlight and a "Free Tools" dropdown.
 * The dropdown opens on hover or focus, and on click for touch screens; Escape closes it.
 */
export function DesktopNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number; show: boolean }>({ left: 0, width: 0, show: false });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = useCallback(
    (l: NavItem) => (l.children ? l.children.some((c) => pathname.startsWith(c.href)) : l.href === "/" ? pathname === "/" : pathname.startsWith(l.href!)),
    [pathname],
  );
  const activeLabel = links.find(isActive)?.label ?? null;
  const target = hover ?? activeLabel;

  // Slide the highlight under the hovered item, or rest it under the current page.
  useLayoutEffect(() => {
    const el = target ? listRef.current?.querySelector<HTMLElement>(`[data-nav="${CSS.escape(target)}"]`) : null;
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth, show: true } : (p) => ({ ...p, show: false }));
  }, [target]);

  useEffect(() => {
    setOpen(null);
    setHover(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => {
      if (!listRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const enter = (label: string, hasChildren: boolean) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHover(label);
    if (hasChildren) setOpen(label);
    else setOpen(null);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => {
      setHover(null);
      setOpen(null);
    }, 120);
  };

  const itemClass = (active: boolean) =>
    `relative z-10 inline-flex min-h-10 items-center gap-1 rounded-full px-4 text-[0.95rem] font-semibold transition-colors motion-reduce:transition-none ${
      active ? "text-maroon" : "text-charcoal hover:text-maroon"
    }`;

  return (
    <nav aria-label="Main" className="hidden xl:block" onMouseLeave={leave}>
      <ul ref={listRef} className="relative flex items-center gap-1">
        <li
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 my-auto h-10 rounded-full bg-parchment ring-1 ring-gold-soft transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: pill.width, transform: `translateX(${pill.left}px)`, opacity: pill.show ? 1 : 0 }}
        />
        {links.map((l) => {
          const active = isActive(l);
          if (!l.children) {
            return (
              <li key={l.label} data-nav={l.label} onMouseEnter={() => enter(l.label, false)} onFocus={() => enter(l.label, false)}>
                <Link href={l.href!} aria-current={pathname === l.href ? "page" : undefined} className={itemClass(active)}>
                  {l.label}
                </Link>
              </li>
            );
          }
          const expanded = open === l.label;
          return (
            <li
              key={l.label}
              data-nav={l.label}
              className="relative"
              onMouseEnter={() => enter(l.label, true)}
              onFocus={() => enter(l.label, true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null);
              }}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-haspopup="true"
                aria-controls={`menu-${l.label}`}
                onClick={() => setOpen(expanded ? null : l.label)}
                className={itemClass(active)}
              >
                {l.label}
                <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {expanded && (
                <div id={`menu-${l.label}`} className="absolute left-1/2 top-full z-40 w-72 -translate-x-1/2 pt-3">
                  <ul className="panel-in overflow-hidden rounded-2xl border border-gold-soft bg-ivory p-2 shadow-lift">
                    {l.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={pathname.startsWith(c.href) ? "page" : undefined}
                          className="block rounded-xl px-4 py-3 transition-colors hover:bg-parchment focus-visible:bg-parchment aria-[current=page]:bg-parchment motion-reduce:transition-none"
                        >
                          <span className="block font-serif text-lg leading-tight text-maroon">{c.label}</span>
                          {c.description && <span className="mt-0.5 block text-xs text-ink-soft">{c.description}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
