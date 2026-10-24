import Link from "next/link";
import { CalendarCheck, Compass, MessageCircle, Sparkles, Star, type LucideIcon } from "lucide-react";
import { ArrowRight, HelpCircle, Route as RouteIcon, MessageSquareQuote } from "lucide-react";
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

export function Testimonials({ s, items, asH1 = false }: { s: Section; items: Testimonial[]; asH1?: boolean }) {
  // Only verified + published testimonials ever reach this component.
  if (items.length === 0) return null;
  return (
    <section className="bg-white-warm py-14 sm:py-20">
      <Container>
        <SectionHeading as={asH1 ? "h1" : "h2"} eyebrow={s.eyebrow} title={s.heading} description={s.body} />
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <li key={t.id} className="ornate-frame rounded-2xl p-7">
              {t.rating && (
                <p className="mb-3 flex gap-0.5 text-saffron" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                  ))}
                </p>
              )}
              <blockquote className="whitespace-pre-line font-serif text-xl text-charcoal">“{t.quote}”</blockquote>
              <p className="mt-4 text-sm font-semibold text-maroon">
                {t.author_name}
                {t.author_detail && <span className="font-normal text-ink-soft"> · {t.author_detail}</span>}
              </p>
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
  { href: "/how-it-works", title: "How it works", text: "What to expect, step by step, from booking to your reading.", Icon: RouteIcon },
  { href: "/reviews", title: "Client reviews", text: "Verified words from people who have consulted.", Icon: MessageSquareQuote },
  { href: "/faq", title: "Questions answered", text: "Birth details, timing, payment and rescheduling.", Icon: HelpCircle },
];

/** Gateway cards from the (now shorter) home page to the dedicated pages. */
export function ExploreTiles() {
  return (
    <section className="cv-auto py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Explore" title="Everything you need, one step at a time" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
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
