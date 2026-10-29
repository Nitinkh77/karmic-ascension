"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { AccountLink } from "@/components/site/AccountLink";
import type { NavItem } from "@/components/site/Header";
import { buttonStyles } from "@/components/ui";

export function MobileNav({ links }: { links: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [group, setGroup] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close when the route changes.
  useEffect(() => {
    setOpen(false);
    setGroup(null);
  }, [pathname]);

  // Escape closes and returns focus to the toggle; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="shrink-0 xl:hidden">
      <button
        ref={toggleRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold-soft bg-white-warm text-maroon"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="panel-in absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-gold-soft bg-ivory px-5 pb-6 pt-3 shadow-lift"
        >
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {links.map((l) =>
                l.children ? (
                  <li key={l.label}>
                    <button
                      type="button"
                      aria-expanded={group === l.label}
                      aria-controls={`mobile-group-${l.label}`}
                      onClick={() => setGroup((g) => (g === l.label ? null : l.label))}
                      className="flex min-h-12 w-full items-center justify-between border-b border-sand/70 text-left font-serif text-xl text-maroon"
                    >
                      {l.label}
                      <ChevronDown className={`h-5 w-5 transition-transform motion-reduce:transition-none ${group === l.label ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {group === l.label && (
                      <ul id={`mobile-group-${l.label}`} className="border-b border-sand/70 bg-parchment/60 py-1 pl-4">
                        {l.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              aria-current={pathname === c.href ? "page" : undefined}
                              className="flex min-h-12 flex-col justify-center text-maroon aria-[current=page]:text-saffron-deep"
                            >
                              <span className="font-serif text-lg">{c.label}</span>
                              {c.description && <span className="text-xs text-ink-soft">{c.description}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link
                      href={l.href!}
                      aria-current={pathname === l.href ? "page" : undefined}
                      className="flex min-h-12 items-center border-b border-sand/70 font-serif text-xl text-maroon transition-transform active:translate-x-1 aria-[current=page]:text-saffron-deep"
                    >
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
            <div className="mt-3"><AccountLink className="w-full justify-center border border-sand" /></div>
            <Link href="/book" className={buttonStyles("primary", "lg", "mt-5 w-full")}>
              Book a consultation
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
