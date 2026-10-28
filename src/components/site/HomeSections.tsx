import Link from "next/link";
import { BadgeCheck, CalendarCheck, Compass, MessageCircle, Quote, Sparkles, Star, type LucideIcon } from "lucide-react";
import { ArrowRight, Orbit, Sun, HelpCircle, MessageSquareQuote, Route as RouteIcon, UserRound, Phone as PhoneIcon } from "lucide-react";
import { Mandala } from "@/components/art/Mandala";
import { OrnamentDivider } from "@/components/art/Ornaments";
import { ZodiacWheel } from "@/components/art/ZodiacWheel";
import { Backdrop } from "@/components/site/Backdrop";
import { FaqList } from "@/components/site/FaqList";
import { ImageSlot } from "@/components/site/ImageSlot";
import { Reveal } from "@/components/site/Reveal";
import { ServiceCard } from "@/components/site/ServiceCard";
import { ButtonLink, Container, RichText, SectionHeading } from "@/components/ui";
import { GANESH_INVOCATION } from "@/lib/defaults";
import type { Faq, Section, Service, SiteSettings, Testimonial } from "@/lib/types";
import { safeHref, whatsappLink } from "@/lib/utils";

export interface HomeData {
  settings: SiteSettings;
  services: Service[];
  faqs: Faq[];
  testimonials: Testimonial[];
  bookable: boolean;
}

export function Hero({ s, settings, bookable }: { s: Section; settings: SiteSettings; bookable: boolean }) {
  return (
    <section className="relative isolate overflow-hidden">
      <Backdrop />
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-7">
          <p className="deva mb-4 text-xl text-gold-deep" lang="sa">
            {GANESH_INVOCATION}
          </p>
          {s.eyebrow && <p className="eyebrow mb-4">{s.eyebrow}</p>}
          <h1 className="text-5xl text-maroon sm:text-6xl lg:text-[4.25rem]">{s.heading}</h1>
          {s.body && <p className="mt-6 max-w-xl text-lg text-ink-soft sm:text-xl">{s.body}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {bookable ? (
              <ButtonLink href={safeHref(s.ctaHref, "/book")} size="lg">
                {s.ctaLabel || "Book a consultation"}
              </ButtonLink>
            ) : (
              <ButtonLink href="/contact" size="lg">
                Contact to book
              </ButtonLink>
            )}
            <ButtonLink href="/services" variant="secondary" size="lg">
              Explore consultations
            </ButtonLink>
          </div>
          {settings.hours_text && (
            <p className="mt-6 text-sm text-ink-soft">
              Consultations: <span className="font-semibold text-charcoal">{settings.hours_text}</span>
            </p>
          )}
        </div>

        <div className="lg:col-span-5">
          {s.imageUrl ? (
            <ImageSlot
              src={s.imageUrl}
              alt={s.imageAlt}
              shape="arch"
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="mx-auto aspect-[4/5] w-full max-w-sm sm:max-w-md"
            />
          ) : (
            <ZodiacWheel className="mx-auto max-w-sm sm:max-w-md" />
          )}
        </div>
      </Container>
    </section>
  );
}

export function Intro({ s }: { s: Section }) {
  return (
    <section className="py-14 sm:py-20">
      <Container narrow>
        <Reveal>
          <OrnamentDivider className="mb-8" />
          <SectionHeading eyebrow={s.eyebrow} title={s.heading} description={s.body} />
        </Reveal>
      </Container>
    </section>
  );
}

export function ServicesSection({ s, data }: { s: Section; data: HomeData }) {
  return (
    <section className="cv-auto py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={s.eyebrow} title={s.heading} description={s.body} />
        {data.services.length === 0 ? (
          <p className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-gold bg-white-warm p-8 text-center text-ink-soft">
            Consultations will be listed here soon. Please get in touch to enquire.
          </p>
        ) : (
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {data.services.map((svc, i) => (
              <Reveal key={svc.id} delay={i * 0.06} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <ServiceCard service={svc} bookable={data.bookable} />
              </Reveal>
            ))}
          </div>
        )}
        {s.ctaHref && s.ctaLabel && (
          <div className="mt-10 text-center">
            <ButtonLink href={safeHref(s.ctaHref)} variant="secondary">
              {s.ctaLabel}
            </ButtonLink>
          </div>
        )}
      </Container>
    </section>
  );
}

export function Prayer({ s }: { s: Section }) {
  return (
    <section className="cv-auto border-y border-gold-soft bg-parchment py-14 sm:py-20">
      <Container narrow>
        <Reveal className="text-center">
          <p className="eyebrow mb-3">{s.eyebrow}</p>
          {s.heading && <h2 className="text-2xl text-maroon sm:text-3xl">{s.heading}</h2>}
          <blockquote className="deva mx-auto mt-8 max-w-2xl whitespace-pre-line text-2xl text-maroon sm:text-3xl" lang="sa">
            {s.body}
          </blockquote>
          {s.items.length > 0 && (
            <dl className="mx-auto mt-10 grid max-w-3xl gap-6 text-left sm:grid-cols-2">
              {s.items.map((it) => (
                <div key={it.title} className="rounded-xl border border-gold-soft bg-white-warm p-5">
                  <dt className="eyebrow mb-2">{it.title}</dt>
                  <dd className="text-ink-soft">{it.text}</dd>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </Container>
    </section>
  );
}

const WHY_ICONS: LucideIcon[] = [Compass, Sparkles, CalendarCheck];

export function Why({ s, asH1 = false }: { s: Section; asH1?: boolean }) {
  if (s.items.length === 0) return null;
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading as={asH1 ? "h1" : "h2"} eyebrow={s.eyebrow} title={s.heading} description={s.body} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {s.items.map((it, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <Reveal key={it.title} delay={i * 0.06}>
                <div className="ornate-frame h-full rounded-2xl p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-parchment text-maroon">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-2xl text-maroon">{it.title}</h3>
                  <p className="mt-2 text-ink-soft">{it.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function Process({ s, asH1 = false }: { s: Section; asH1?: boolean }) {
  if (s.items.length === 0) return null;
  return (
    <section className="bg-white-warm py-14 sm:py-20">
      <Container>
        <SectionHeading as={asH1 ? "h1" : "h2"} eyebrow={s.eyebrow} title={s.heading} description={s.body} />
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {s.items.map((it, i) => (
            <li key={it.title} className="relative">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon font-serif text-xl text-ivory"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl text-maroon">
                <span className="sr-only">Step {i + 1}: </span>
                {it.title}
              </h3>
              <p className="mt-1.5 text-ink-soft">{it.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function AboutTeaser({ s }: { s: Section }) {
  return (
    <section className="cv-auto py-14 sm:py-20">
      <Container className="grid items-center gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <ImageSlot
            src={s.imageUrl}
            alt={s.imageAlt || "Neelabh Shivam"}
            shape="arch"
            className="mx-auto aspect-[4/5] w-full max-w-xs md:max-w-none"
            sizes="(min-width: 768px) 40vw, 80vw"
          />
        </div>
        <Reveal className="md:col-span-7">
          {s.eyebrow && <p className="eyebrow mb-3">{s.eyebrow}</p>}
          <h2 className="text-4xl text-maroon sm:text-5xl">{s.heading}</h2>
          <RichText text={s.body} className="mt-5 text-lg" />
          {s.ctaHref && s.ctaLabel && (
            <ButtonLink href={safeHref(s.ctaHref)} variant="secondary" className="mt-7">
              {s.ctaLabel}
            </ButtonLink>
          )}
        </Reveal>
      </Container>
    </section>
  );
}

/** One review card: used on the home page and on /reviews. */
export function ReviewCard({ t }: { t: Testimonial }) {
  const initial = (t.author_name.trim()[0] ?? "•").toUpperCase();
  const isGoogle = /google/i.test(t.source ?? "");
  return (
    <figure className="ornate-frame relative flex h-full flex-col rounded-2xl p-6 sm:p-7">
      <Quote className="absolute right-5 top-5 h-8 w-8 text-gold/40" aria-hidden="true" />
      {t.rating ? (
        <p className="mb-3 flex gap-0.5 text-saffron" aria-label={`${t.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, k) => (
            <Star key={k} className={`h-4 w-4 ${k < (t.rating ?? 0) ? "fill-current" : "fill-transparent opacity-40"}`} aria-hidden="true" />
          ))}
        </p>
      ) : null}
      <blockquote className="flex-1 whitespace-pre-line font-serif text-lg leading-relaxed text-charcoal sm:text-xl">“{t.quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-gold/30 pt-4">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-maroon to-saffron font-serif text-lg text-white"
        >
          {initial}
        </span>
        <span className="min-w-0 text-sm">
          <span className="block truncate font-semibold text-maroon">{t.author_name}</span>
          {t.author_detail && <span className="block truncate text-xs text-ink-soft">{t.author_detail}</span>}
          {isGoogle && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-ink-soft">
              <BadgeCheck className="h-3.5 w-3.5 text-saffron" aria-hidden="true" /> Google review
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials({ s, items, asH1 = false }: { s: Section; items: Testimonial[]; asH1?: boolean }) {
  // Only verified + published testimonials ever reach this component.
  if (items.length === 0) return null;
  return (
    <section className="bg-white-warm py-14 sm:py-20">
      <Container>
        <SectionHeading as={asH1 ? "h1" : "h2"} eyebrow={s.eyebrow} title={s.heading} description={s.body} />
        <ul className="mt-12 gap-6 md:columns-2 lg:columns-3">
          {items.map((t) => (
            <li key={t.id} className="mb-6 break-inside-avoid">
              <ReviewCard t={t} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function Faqs({ s, faqs, asH1 = false }: { s: Section; faqs: Faq[]; asH1?: boolean }) {
  if (faqs.length === 0) return null;
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading as={asH1 ? "h1" : "h2"} eyebrow={s.eyebrow} title={s.heading} description={s.body} />
        <div className="mt-10">
          <FaqList faqs={faqs} />
        </div>
      </Container>
    </section>
  );
}

export function FinalCta({ s, settings, bookable }: { s: Section; settings: SiteSettings; bookable: boolean }) {
  const wa = whatsappLink(settings.whatsapp_number, "Namaste, I would like to ask about a consultation.");
  return (
    <section className="cv-auto relative isolate overflow-hidden py-14 sm:py-20">
      <Backdrop />
      <Container>
        <div className="ornate-frame grid items-center gap-8 rounded-3xl bg-parchment p-8 sm:p-12 md:grid-cols-12">
          <div className="md:col-span-8">
            <h2 className="text-3xl text-maroon sm:text-4xl">{s.heading}</h2>
            {s.body && <p className="mt-4 max-w-xl text-lg text-ink-soft">{s.body}</p>}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {bookable ? (
                <ButtonLink href={safeHref(s.ctaHref, "/book")} size="lg">
                  {s.ctaLabel || "Book a consultation"}
                </ButtonLink>
              ) : (
                <ButtonLink href="/contact" size="lg">
                  Contact us
                </ButtonLink>
              )}
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold bg-white-warm px-7 text-base font-semibold text-maroon hover:bg-ivory"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  WhatsApp
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
            <p className="mt-5 text-sm text-ink-soft">
              Prefer to read first? See the{" "}
              <Link href="/cancellation-refund" className="font-semibold text-maroon underline underline-offset-2">
                rescheduling policy
              </Link>
              .
            </p>
          </div>
          <div className="hidden md:col-span-4 md:block">
            <Mandala className="mx-auto w-full max-w-[16rem] text-gold" />
          </div>
        </div>
      </Container>
    </section>
  );
}

const EXPLORE: Array<{ href: string; title: string; text: string; Icon: LucideIcon }> = [
  { href: "/services", title: "Consultations", text: "Choose the reading that fits your question, with prices and durations.", Icon: Sparkles },
  { href: "/horoscope", title: "Daily horoscope", text: "Today's guidance for your Moon sign, calculated from the sky.", Icon: Sun },
  { href: "/kundali", title: "Free Kundali", text: "Generate your Vedic birth chart and Vimshottari dasha instantly.", Icon: Orbit },
  { href: "/how-it-works", title: "How it works", text: "What to expect, step by step, from booking to your reading.", Icon: RouteIcon },
  { href: "/reviews", title: "Client reviews", text: "Verified words from people who have consulted.", Icon: MessageSquareQuote },
  { href: "/about", title: "About Neelabh Shivam", text: "Who you will be speaking with, and his approach.", Icon: UserRound },
  { href: "/faq", title: "Questions answered", text: "Birth details, timing, payment and rescheduling.", Icon: HelpCircle },
  { href: "/contact", title: "Contact", text: "Ask a question first, or reach us on WhatsApp.", Icon: PhoneIcon },
];

/** Gateway cards from the (now shorter) home page to the dedicated pages. */
export function ExploreTiles() {
  return (
    <section className="cv-auto py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Explore" title="Where would you like to begin?" />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE.map(({ href, title, text, Icon }, i) => (
            <li key={href}>
              <Reveal delay={i * 0.06} className="h-full">
                <Link href={href} className="spring ornate-frame group flex h-full flex-col rounded-2xl p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-parchment text-maroon">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="mt-5 font-serif text-2xl font-semibold text-maroon">{title}</span>
                  <span className="mt-2 flex-1 text-ink-soft">{text}</span>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-maroon">
                    Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Photo mosaic: the brand mark plus the consultation photos, each stamped with the logo. */
export function HomeGallery({ services }: { services: Service[] }) {
  const shots = services.filter((s) => s.imageUrl).slice(0, 4);
  return (
    <section className="cv-auto py-14 sm:py-20" aria-label="Photos from Karmic Ascension">
      <Container>
        <SectionHeading eyebrow="Our practice" title="Guidance rooted in Vedic tradition" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          <Reveal className="col-span-2 lg:row-span-2">
            <div className="ornate-frame relative flex h-full min-h-64 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl bg-parchment p-8 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-512.png" width={512} height={512} alt="Karmic Ascension – Vedic Astrology logo" loading="lazy" decoding="async" draggable={false} className="h-40 w-40 rounded-xl object-cover shadow-card sm:h-52 sm:w-52" />
              <p className="font-serif text-2xl text-maroon sm:text-3xl">Resolve Pending Karma</p>
              <p className="max-w-xs text-sm text-ink-soft">Vedic astrology consultations with Neelabh Shivam, Prayagraj.</p>
            </div>
          </Reveal>
          {shots.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.06} className="h-full">
              <Link href={`/services/${s.slug}`} className="spring group relative block aspect-square overflow-hidden rounded-2xl">
                <ImageSlot src={s.imageUrl} alt={s.imageAlt || s.title} className="h-full w-full" sizes="(min-width: 1024px) 25vw, 50vw" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 text-sm font-semibold text-white">
                  {s.title}
                </span>
                {/* Logo stamp */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" width={36} height={36} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} className="absolute right-2 top-2 h-9 w-9 rounded-md ring-2 ring-white/80" />
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Up to six verified reviews with a link to all of them. Renders nothing when there are none. */
export function HomeReviews({ items }: { items: Testimonial[] }) {
  const top = items.slice(0, 6);
  if (top.length === 0) return null;
  return (
    <section className="cv-auto relative isolate overflow-hidden bg-white-warm py-14 sm:py-20" aria-label="Client reviews">
      <Container>
        <SectionHeading eyebrow="Client reviews" title="What clients say" description="Real words from people who have had a consultation, taken from Google reviews." />
        <ul className="mt-10 gap-6 md:columns-2 lg:columns-3">
          {top.map((t, i) => (
            <li key={t.id} className="mb-6 break-inside-avoid">
              <Reveal delay={(i % 3) * 0.06}>
                <ReviewCard t={t} />
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-center">
          <ButtonLink href="/reviews" variant="secondary">Read all reviews</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
