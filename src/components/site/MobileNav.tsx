
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonStyles } from "@/components/ui";

type NavLink = {
  href: string;
  label: string;
};

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="relative md:hidden">
      <button
        ref={toggleRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold-soft bg-white-warm text-maroon"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full z-40 border-b border-gold-soft bg-ivory px-5 pb-6 pt-3 shadow-lift"
        >
          <nav aria-label="Mobile navigation">
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={
                      pathname === link.href ? "page" : undefined
                    }
                    onClick={closeMenu}
                    className="flex min-h-12 items-center border-b border-sand/70 font-serif text-xl text-maroon aria-[current=page]:text-saffron-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/book"
              onClick={closeMenu}
              className={buttonStyles("primary", "lg", "mt-5 w-full")}
            >
              Book a consultation
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
