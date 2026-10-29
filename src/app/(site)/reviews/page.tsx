import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star, Quote, ExternalLink } from "lucide-react";
import { Backdrop } from "@/components/site/Backdrop";
import { Reveal } from "@/components/site/Reveal";
import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getPageContent, getSettings, getTestimonials, sectionByKey } from "@/lib/data";
import { safeHref } from "@/lib/utils";
import type { SiteSettings, Testimonial } from "@/lib/types";

// Re-read the database at most once a minute so admin edits show up without a redeploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Client reviews",
  description: "Verified reviews from clients of Karmic Ascension – Vedic Astrology.",
  alternates: { canonical: "/reviews" },
};

/* ── helpers ─────────────────────────────────────────────────────────── */

/** First letter(s) for the avatar fallback. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 1).toUpperCase();
}

/** Deterministic soft colour from a name string for the avatar ring. */
function avatarColor(name: string): string {
  const palette = [
    "from-rose-400 to-amber-300",
    "from-violet-400 to-fuchsia-300",
    "from-emerald-400 to-teal-300",
    "from-sky-400 to-indigo-300",
    "from-amber-400 to-orange-300",
    "from-pink-400 to-rose-300",
    "from-teal-400 to-cyan-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

/* ── Review Card ─────────────────────────────────────────────────────── */

function ReviewCard({ t, index }: { t: Testimonial; index: number }) {
  const isGoogle = t.source?.toLowerCase().includes("google");
  return (
    <Reveal delay={index * 0.07} className="h-full">
      <figure className="group relative flex h-full flex-col rounded-2xl border border-gold-soft bg-white-warm p-6 shadow-card transition-shadow hover:shadow-lift sm:p-7">
        {/* Inner gold frame accent */}
        <span className="pointer-events-none absolute inset-[5px] rounded-[inherit] border border-gold-soft/40" />

        {/* Decorative quote mark */}
        <Quote
          className="absolute -right-1 -top-1 h-12 w-12 rotate-12 text-gold-soft/30 sm:h-14 sm:w-14"
          aria-hidden="true"
          strokeWidth={1}
        />

        {/* Header: avatar + name + source */}
        <div className="relative flex items-start gap-4">
          {/* Avatar circle */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm ${avatarColor(t.author_name)}`}
          >
            <span className="text-sm leading-none">{initials(t.author_name)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-charcoal">{t.author_name}</p>
            {t.author_detail && (
              <p className="truncate text-xs text-ink-soft">{t.author_detail}</p>
            )}
          </div>
          {/* Google badge */}
          {isGoogle && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
              <GoogleIcon className="h-3 w-3" />
              Google
            </span>
          )}
        </div>

        {/* Stars */}
        {t.rating && (
          <p
            className="mt-4 flex gap-0.5 text-saffron"
            aria-label={`${t.rating} out of 5 stars`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < t.rating! ? "fill-current" : "text-sand"}`}
                aria-hidden="true"
              />
            ))}
          </p>
        )}

        {/* Quote */}
        <blockquote className="mt-3 flex-1 whitespace-pre-line text-[0.95rem] leading-relaxed text-charcoal">
          &ldquo;{t.quote}&rdquo;
        </blockquote>

        {/* Source tag */}
        {t.source && (
          <p className="mt-4 flex items-center gap-1 text-xs text-ink-soft">
            {isGoogle && <GoogleIcon className="h-3 w-3" />}
            <span>Verified on {t.source}</span>
          </p>
        )}
      </figure>
    </Reveal>
  );
}

/* ── Google "G" icon (inline SVG) ────────────────────────────────────── */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ── Summary banner ──────────────────────────────────────────────────── */

function ReviewSummary({ count, settings }: { count: number; settings: SiteSettings }) {
  const rating = settings.google_rating ? Number(settings.google_rating).toFixed(1) : "5.0";
  const total = settings.google_review_count ?? count;
  return (
    <Reveal>
      <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-gold-soft bg-parchment/60 px-6 py-5 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <GoogleIcon className="h-7 w-7" />
          <div>
            <p className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-charcoal">{rating}</span>
              <span className="flex gap-0.5 text-saffron">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </span>
            </p>
            <p className="text-sm text-ink-soft">
              Based on {total} Google {total === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
        {(settings.google_business_url || settings.google_review_url) && (
          <div className="flex flex-wrap justify-center gap-2 sm:ml-auto">
            {settings.google_business_url && (
              <a href={safeHref(settings.google_business_url)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gold bg-white-warm px-4 text-sm font-semibold text-maroon hover:bg-parchment">
                See all on Google<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {settings.google_review_url && (
              <a href={safeHref(settings.google_review_url)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-maroon px-4 text-sm font-semibold text-ivory hover:bg-maroon-deep">
                Write a review<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </div>
    </Reveal>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function ReviewsPage() {
  const [page, items, settings] = await Promise.all([
    getPageContent("home"),
    getTestimonials(),
    getSettings(),
  ]);
  if (page.notFound) notFound();
  const testi = sectionByKey(page.sections, "testimonials");
  const bookable = getBookingMode().enabled;

  const googleReviews = items.filter((t) => t.source?.toLowerCase().includes("google"));

  return (
    <>
      {/* ── Hero heading ───────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden py-16 text-center sm:py-20">
        <Backdrop />
        <Container narrow>
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow={testi?.eyebrow ?? "Client words"}
              title={testi?.heading ?? "What clients say"}
              description="Verified reviews from people who have consulted with Neelabh Shivam at Karmic Ascension."
            />
          </Reveal>

          {/* Star summary */}
          {(googleReviews.length > 0 || settings.google_business_url) && <ReviewSummary count={googleReviews.length} settings={settings} />}
        </Container>
      </section>

      {/* ── Review cards grid ──────────────────────────────────── */}
      {items.length > 0 ? (
        <section className="cv-auto pb-16 pt-2 sm:pb-20">
          <Container>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((t, i) => (
                <li key={t.id}>
                  <ReviewCard t={t} index={i} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : (
        <section className="py-16 text-center">
          <Container narrow>
            <p className="text-lg text-ink-soft">Verified reviews will appear here soon.</p>
          </Container>
        </section>
      )}

      {/* ── AstroSage link ─────────────────────────────────────── */}
      {settings.astrosage_url && (
        <section className="pb-6 text-center">
          <Container narrow>
            <Reveal>
              <p className="text-ink-soft">
                Neelabh Shivam is also listed on AstroSage, where clients leave public ratings.
              </p>
              <a
                href={safeHref(settings.astrosage_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold bg-white-warm px-7 font-semibold text-maroon hover:bg-parchment"
              >
                Read reviews on AstroSage
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Reveal>
          </Container>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden py-14 text-center sm:py-20">
        <Backdrop />
        <Container narrow>
          <Reveal>
            <p className="font-serif text-2xl text-maroon sm:text-3xl">Ready when you are.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={bookable ? "/book" : "/contact"} size="lg">
                {bookable ? "Book a consultation" : "Contact us"}
              </ButtonLink>
              <ButtonLink href="/services" variant="secondary" size="lg">
                View consultations
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
