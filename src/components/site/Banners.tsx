import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui";
import type { SiteStatus } from "@/lib/data";
import type { SiteSettings } from "@/lib/types";
import { safeHref } from "@/lib/utils";

/** Owner-configured announcement bar (Admin → Settings). Rendered only when active. */
export function AnnouncementBar({ settings }: { settings: SiteSettings }) {
  if (!settings.announcement_active || !settings.announcement_text) return null;
  const inner = <span>{settings.announcement_text}</span>;
  return (
    <div className="bg-maroon text-ivory">
      <Container className="flex min-h-10 items-center justify-center py-2 text-center text-sm">
        {settings.announcement_href ? (
          <Link href={safeHref(settings.announcement_href)} className="underline-offset-4 hover:underline">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </Container>
    </div>
  );
}

/** Shown when Supabase is missing or unreachable — never silently pretends data is saved. */
export function SetupBanner({ site }: { site: SiteStatus }) {
  if (site.status === "ok") return null;
  return (
    <div role="status" className="border-b border-saffron/40 bg-saffron-soft text-charcoal">
      <Container className="flex items-start gap-3 py-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-saffron-deep" aria-hidden="true" />
        <p>
          <strong className="font-semibold">Setup required.</strong>{" "}
          {site.status === "not_configured"
            ? "Supabase is not configured, so this site is showing built-in draft content and booking is switched off. Nothing you see here is saved to a database. Add your keys to .env.local and run the migrations (see README)."
            : site.reason}
        </p>
      </Container>
    </div>
  );
}
