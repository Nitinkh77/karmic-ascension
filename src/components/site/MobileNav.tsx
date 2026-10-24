"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonStyles } from "@/components/ui";

export function MobileNav({ links }: { links: Array<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close when the route changes.
  useEffect(() => {
    setOpen(false);
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
    <div className="shrink-0 md:hidden">
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
          className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-gold-soft bg-ivory px-5 pb-6 pt-3 shadow-lift"
        >
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className="flex min-h-12 items-center border-b border-sand/70 font-serif text-xl text-maroon aria-[current=page]:text-saffron-deep"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/book" className={buttonStyles("primary", "lg", "mt-5 w-full")}>
              Book a consultation
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
