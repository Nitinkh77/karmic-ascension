import Link from "next/link";
import { ExternalLink, LogOut, Search } from "lucide-react";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/AdminNav";
import { Emblem } from "@/components/art/Ornaments";
import { logout } from "@/app/admin/login/actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate for EVERY admin page. Non-admins are redirected to the login page.
  const { profile, user } = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <header className="relative flex h-16 items-center justify-between gap-3 border-b border-leaf/25 bg-night px-4 text-ivory sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <AdminMobileNav />
          <Link href="/admin" aria-label="Karmic Ascension admin dashboard" className="flex min-w-0 items-center gap-2">
            <Emblem className="h-9 w-9 shrink-0" />
            <span className="truncate font-serif text-lg font-semibold text-leaf-soft sm:text-xl">
              Karmic Ascension<span className="hidden text-ivory/50 sm:inline"> / </span>
              <span className="hidden text-sm font-sans font-medium uppercase tracking-[0.18em] text-ivory/80 sm:inline">Command center</span>
            </span>
          </Link>
        </div>
        <form action="/admin/bookings" method="get" role="search" className="hidden max-w-sm flex-1 md:block">
          <label htmlFor="admin-search" className="sr-only">Search bookings by name, phone, email or code</label>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/50" aria-hidden="true" />
            <input
              id="admin-search"
              name="q"
              type="search"
              placeholder="Search bookings: name, phone, code"
              className="h-10 w-full rounded-lg border border-leaf/30 bg-white/5 pl-9 pr-3 text-sm text-ivory placeholder:text-ivory/45 focus:border-leaf focus:outline-none"
            />
          </span>
        </form>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-ivory/75 hover:bg-white/5 sm:inline-flex">
            View site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <span className="hidden max-w-[12rem] truncate text-ivory/60 xl:inline">{profile.email ?? user.email}</span>
          <form action={logout}>
            <button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-leaf/40 px-3 text-leaf-soft hover:bg-white/5">
              <LogOut className="h-4 w-4" aria-hidden="true" /> <span className="hidden min-[400px]:inline">Sign out</span><span className="sr-only min-[400px]:hidden">Sign out</span>
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-8" id="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
