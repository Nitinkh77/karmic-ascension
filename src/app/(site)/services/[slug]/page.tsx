import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, MessageCircle, UserRound } from "lucide-react";
import { ImageSlot } from "@/components/site/ImageSlot";
import { FaqList } from "@/components/site/FaqList";
import { PriceTag } from "@/components/site/ServiceCard";
import { ButtonLink, Container, RichText } from "@/components/ui";
import { Backdrop } from "@/components/site/Backdrop";
import { Reveal } from "@/components/site/Reveal";
import { ServiceCard } from "@/components/site/ServiceCard";
import { BOOKING_STEPS, copyFor } from "@/lib/service-content";
import { getBookingMode } from "@/lib/booking/config";
import { getFaqs, getServiceBySlug, getServices, getSettings } from "@/lib/data";
import { formatDuration, formatPrice, whatsappLink } from "@/lib/utils";

// Re-read the database at most once a minute so admin edits show up without a redeploy.
export const revalidate = 60;

// Below the fold: loaded as its own chunk so it never delays the first paint.
const LeadForm = dynamic(() => import("@/components/site/LeadForm").then((m) => m.LeadForm));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getServiceBySlug(slug);
  if (!s) return { title: "Consultation not found", robots: { index: false } };
  return {
    title: s.title,
    description: s.short_description || undefined,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: {
      title: s.title,
      description: s.short_description || undefined,
      url: `/services/${s.slug}`,
      images: s.imageUrl ? [{ url: s.imageUrl }] : undefined,
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [settings, faqs, all] = await Promise.all([getSettings(), getFaqs(service.isDefault ? null : service.id), getServices()]);
  const bookable = getBookingMode().enabled;
  const wa = whatsappLink(settings.whatsapp_number, `Namaste, I would like to ask about: ${service.title}`);
  const copy = copyFor(service.slug);
  const covers = service.features.length > 0 ? service.features : (copy?.covers ?? []);
  const related = all.filter((s) => s.id !== service.id).slice(0, 3);
  const price = formatPrice(service.price_paise, service.currency);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.short_description || service.description || undefined,
    provider: { "@type": "Person", name: "Neelabh Shivam" },
    areaServed: "Worldwide (online)",
    ...(service.price_paise !== null && {
      offers: { "@type": "Offer", price: (service.price_paise / 100).toFixed(2), priceCurrency: service.currency },
    }),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="relative isolate overflow-hidden">
        <Backdrop />
        <Container className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-soft">
              <Link href="/services" className="hover:text-maroon hover:underline">Consultations</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{service.title}</span>
            </nav>
            <h1 className="text-4xl text-maroon sm:text-5xl lg:text-[3.25rem]">{service.title}</h1>
            {service.short_description && <p className="mt-4 max-w-xl text-lg text-ink-soft sm:text-xl">{service.short_description}</p>}
            <ul className="mt-6 flex flex-wrap gap-2 text-sm">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-gold-soft bg-white-warm px-3.5 py-1.5"><Clock className="h-4 w-4 text-gold-deep" aria-hidden="true" />{formatDuration(service.duration_minutes)}</li>
              <li className="rounded-full border border-gold-soft bg-white-warm px-3.5 py-1.5 font-semibold text-maroon">{price ?? "Price on request"}</li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-gold-soft bg-white-warm px-3.5 py-1.5"><UserRound className="h-4 w-4 text-gold-deep" aria-hidden="true" />{service.requires_birth_details ? "Birth details needed" : "No birth details needed"}</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {bookable ? (
                <ButtonLink href={`/book?service=${service.slug}`} size="lg">Book This Service</ButtonLink>
              ) : (
                <ButtonLink href="/contact" size="lg">Contact to book</ButtonLink>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="spring inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-gold bg-white-warm px-7 font-semibold text-maroon">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />Ask on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>
          <div className="lg:col-span-5">
            <ImageSlot src={service.imageUrl} alt={service.imageAlt || service.title} shape="arch" priority sizes="(min-width: 1024px) 40vw, 90vw" className="mx-auto aspect-[4/5] w-full max-w-sm lg:max-w-none" />
          </div>
        </Container>
      </header>

      <Container className="grid gap-10 pb-16 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          {(service.description || copy) && (
            <Reveal>
              <section aria-labelledby="overview-h">
                <h2 id="overview-h" className="text-3xl text-maroon">About this consultation</h2>
                {service.description && <RichText text={service.description} className="mt-4 text-lg" />}
                {copy && <p className="mt-4 rounded-xl border border-gold-soft bg-parchment p-4 text-charcoal"><span className="font-semibold text-maroon">Best for: </span>{copy.goodFor}</p>}
              </section>
            </Reveal>
          )}

          {covers.length > 0 && (
            <Reveal>
              <section aria-labelledby="features-h">
                <h2 id="features-h" className="text-3xl text-maroon">What this consultation looks at</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {covers.map((f) => (
                    <li key={f} className="flex gap-3 rounded-xl border border-sand bg-white-warm p-4 text-ink-soft">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />{f}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {service.deliverables.length > 0 && (
            <Reveal>
              <section aria-labelledby="deliv-h">
                <h2 id="deliv-h" className="text-3xl text-maroon">What you receive</h2>
                <ul className="mt-5 space-y-3">
                  {service.deliverables.map((f) => (
                    <li key={f} className="flex gap-3 text-ink-soft"><Check className="mt-1 h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />{f}</li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {copy && copy.prepare.length > 0 && (
            <Reveal>
              <section aria-labelledby="prep-h">
                <h2 id="prep-h" className="text-3xl text-maroon">Before your session</h2>
                <p className="mt-3 text-ink-soft">Please have these ready when you book:</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
                  {copy.prepare.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </section>
            </Reveal>
          )}

          {copy?.note && <p className="rounded-xl border border-saffron/40 bg-saffron-soft p-4 text-sm text-charcoal">{copy.note}</p>}

          <Reveal>
            <section aria-labelledby="how-h">
              <h2 id="how-h" className="text-3xl text-maroon">How booking works</h2>
              <ol className="mt-6 grid gap-5 sm:grid-cols-2">
                {BOOKING_STEPS.map((st, i) => (
                  <li key={st.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon font-serif text-lg text-ivory" aria-hidden="true">{i + 1}</span>
                    <span><span className="block font-semibold text-charcoal">{st.title}</span><span className="text-ink-soft">{st.text}</span></span>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>
        </div>

        <aside className="lg:col-span-4">
          <div className="ornate-frame sticky top-24 rounded-2xl p-7">
            <p className="eyebrow">Book this consultation</p>
            <div className="mt-3"><PriceTag service={service} /></div>
            <p className="mt-2 flex items-center gap-2 text-ink-soft"><Clock className="h-4 w-4" aria-hidden="true" />{formatDuration(service.duration_minutes)}</p>
            {service.price_paise === null && (
              <p className="mt-3 rounded-lg bg-saffron-soft px-3 py-2 text-sm text-charcoal">The price for this consultation has not been published. Please enquire before booking.</p>
            )}
            {settings.hours_text && <p className="mt-4 text-sm text-ink-soft">Sessions: <span className="font-semibold text-charcoal">{settings.hours_text}</span> (IST)</p>}
            <div className="mt-6 space-y-3">
              {bookable ? (
                <ButtonLink href={`/book?service=${service.slug}`} size="lg" className="w-full">Book This Service</ButtonLink>
              ) : (
                <ButtonLink href="/contact" size="lg" className="w-full">Contact to book</ButtonLink>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="spring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-gold bg-white-warm px-7 font-semibold text-maroon">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />Ask on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>
        </aside>
      </Container>

      {faqs.length > 0 && (
        <section className="cv-auto bg-white-warm py-14" aria-labelledby="svc-faq-h">
          <Container>
            <h2 id="svc-faq-h" className="mb-6 text-center text-3xl text-maroon">Questions about this consultation</h2>
            <FaqList faqs={faqs} />
          </Container>
        </section>
      )}

      {related.length > 0 && (
        <section className="cv-auto py-16" aria-labelledby="rel-h">
          <Container>
            <h2 id="rel-h" className="text-center text-3xl text-maroon">Other consultations</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {related.map((r) => <ServiceCard key={r.id} service={r} bookable={bookable} />)}
            </div>
          </Container>
        </section>
      )}

      <section className="cv-auto pb-20">
        <Container>
          <div className="mx-auto max-w-2xl">
            <LeadForm
              source={`service:${service.slug}`}
              serviceId={service.isDefault ? null : service.id}
              title={`Ask about ${service.title}`}
              intro="Not ready to book? Send your question and we will reply personally."
            />
          </div>
        </Container>
      </section>
    </article>
  );
}
