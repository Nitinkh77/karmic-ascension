"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MessageSquareQuote,
  Settings,
  Users,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS: Array<{ href: string; label: string; Icon: LucideIcon }> = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarDays },
  { href: "/admin/leads", label: "Leads", Icon: Users },
  { href: "/admin/services", label: "Services & pricing", Icon: Sparkles },
  { href: "/admin/availability", label: "Availability", Icon: CalendarClock },
  { href: "/admin/content", label: "Website content", Icon: FileText },
  { href: "/admin/media", label: "Media library", Icon: ImageIcon },
  { href: "/admin/faqs", label: "FAQs", Icon: HelpCircle },
  { href: "/admin/testimonials", label: "Testimonials", Icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active ? "bg-maroon text-ivory" : "text-charcoal hover:bg-parchment",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar() {
  return (
    <nav aria-label="Admin" className="hidden w-60 shrink-0 border-r border-sand bg-white-warm p-4 lg:block">
      <NavList />
    </nav>
  );
}

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0 lg:hidden">
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-sand bg-white-warm"
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        aria-label={open ? "Close admin menu" : "Open admin menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <nav
          id="admin-mobile-nav"
          aria-label="Admin"
          className="absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-sand bg-white-warm p-4 shadow-lift"
        >
          <NavList onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </div>
  );
}
