import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
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
      <header className="relative flex h-16 items-center justify-between gap-3 border-b border-sand bg-white-warm px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <AdminMobileNav />
          <Link href="/admin" className="flex items-center gap-2.5">
            <Emblem className="h-8 w-8" />
            <span className="font-serif text-xl font-semibold text-maroon">Karmic Ascension · Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-ink-soft hover:bg-parchment sm:inline-flex">
            View site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <span className="hidden max-w-[12rem] truncate text-ink-soft md:inline">{profile.email ?? user.email}</span>
          <form action={logout}>
            <button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-sand px-3 hover:bg-parchment">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
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
