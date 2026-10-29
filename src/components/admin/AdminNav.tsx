"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Contact,
  FileText,
  HelpCircle,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MessageSquareQuote,
  Settings,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; Icon: LucideIcon };
const GROUPS: Array<{ title: string; items: Item[] }> = [
  {
    title: "Command center",
    items: [
      { href: "/admin", label: "Dashboard overview", Icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", Icon: TrendingUp },
      { href: "/admin/activity", label: "Activity log", Icon: History },
    ],
  },
  {
    title: "Customers & enquiries",
    items: [
      { href: "/admin/clients", label: "Clients (CRM)", Icon: Contact },
      { href: "/admin/customers", label: "Sign-ups", Icon: UserRound },
      { href: "/admin/leads", label: "Leads", Icon: Users },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", Icon: CalendarDays },
      { href: "/admin/availability", label: "Availability", Icon: CalendarClock },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/services", label: "Services & pricing", Icon: Sparkles },
      { href: "/admin/content", label: "Website content", Icon: FileText },
      { href: "/admin/media", label: "Media library", Icon: ImageIcon },
      { href: "/admin/faqs", label: "FAQs", Icon: HelpCircle },
      { href: "/admin/testimonials", label: "Testimonials", Icon: MessageSquareQuote },
    ],
  },
  { title: "System", items: [{ href: "/admin/settings", label: "Settings", Icon: Settings }] },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-leaf">{g.title}</p>
          <ul className="space-y-1">
            {g.items.map(({ href, label, Icon }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-medium transition-colors",
                      active
                        ? "border-leaf bg-leaf/15 text-leaf-soft"
                        : "border-transparent text-ivory/75 hover:bg-white/5 hover:text-ivory",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebar() {
  return (
    <nav aria-label="Admin" className="hidden w-64 shrink-0 bg-night p-4 lg:block">
      <div className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavList />
      </div>
    </nav>
  );
}

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0 lg:hidden">
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-leaf/40 text-leaf-soft"
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
          className="absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-leaf/30 bg-night p-4 shadow-lift"
        >
          <NavList onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </div>
  );
}
