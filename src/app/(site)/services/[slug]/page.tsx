import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, MessageCircle } from "lucide-react";
import { ImageSlot } from "@/components/site/ImageSlot";
import { FaqList } from "@/components/site/FaqList";
import { LeadForm } from "@/components/site/LeadForm";
import { PriceTag } from "@/components/site/ServiceCard";
import { ButtonLink, Container, RichText } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getFaqs, getServiceBySlug, getSettings } from "@/lib/data";
import { formatDuration, whatsappLink } from "@/lib/utils";

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

  const [settings, faqs] = await Promise.all([getSettings(), getFaqs(service.isDefault ? null : service.id)]);
  const bookable = getBookingMode().enabled;
  const wa = whatsappLink(settings.whatsapp_number, `Namaste, I would like to ask about: ${service.title}`);

  return (
    <article className="py-12 sm:py-16">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-soft">
          <Link href="/services" className="hover:text-maroon hover:underline">
            Consultations
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{service.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="text-4xl text-maroon sm:text-5xl">{service.title}</h1>
            {service.short_description && (
              <p className="mt-4 text-xl text-ink-soft">{service.short_description}</p>
            )}
            <ImageSlot
              src={service.imageUrl}
              alt={service.imageAlt || service.title}
              className="mt-8 aspect-[16/9] w-full"
              sizes="(min-width: 1024px) 56vw, 100vw"
              priority
            />
            {service.description && <RichText text={service.description} className="mt-8 text-lg" />}

            {service.features.length > 0 && (
              <section className="mt-10" aria-labelledby="features-h">
                <h2 id="features-h" className="text-2xl text-maroon">
                  What this includes
                </h2>
                <ul className="mt-4 space-y-3">
                  {service.features.map((f) => (
                    <li key={f} className="flex gap-3 text-ink-soft">
                      <Check className="mt-1 h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {service.deliverables.length > 0 && (
              <section className="mt-10" aria-labelledby="deliv-h">
                <h2 id="deliv-h" className="text-2xl text-maroon">
                  What you receive
                </h2>
                <ul className="mt-4 space-y-3">
                  {service.deliverables.map((f) => (
                    <li key={f} className="flex gap-3 text-ink-soft">
                      <Check className="mt-1 h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="ornate-frame sticky top-24 rounded-2xl p-7">
              <PriceTag service={service} />
              <p className="mt-2 flex items-center gap-2 text-ink-soft">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {formatDuration(service.duration_minutes)}
              </p>
              {service.price_paise === null && (
                <p className="mt-3 rounded-lg bg-saffron-soft px-3 py-2 text-sm text-charcoal">
                  The price for this consultation has not been published. Please enquire before booking.
                </p>
              )}
              {settings.hours_text && (
                <p className="mt-4 text-sm text-ink-soft">
                  Sessions: <span className="font-semibold text-charcoal">{settings.hours_text}</span> (IST)
                </p>
              )}
              <div className="mt-6 space-y-3">
                {bookable ? (
                  <ButtonLink href={`/book?service=${service.slug}`} size="lg" className="w-full">
                    Book This Service
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/contact" size="lg" className="w-full">
                    Contact to book
                  </ButtonLink>
                )}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-gold bg-white-warm px-7 font-semibold text-maroon hover:bg-parchment"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                    Ask on WhatsApp
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>

        {faqs.length > 0 && (
          <section className="mt-16" aria-labelledby="svc-faq-h">
            <h2 id="svc-faq-h" className="mb-6 text-center text-3xl text-maroon">
              Questions about this consultation
            </h2>
            <FaqList faqs={faqs} />
          </section>
        )}

        <div className="mx-auto mt-16 max-w-2xl">
          <LeadForm
            source={`service:${service.slug}`}
            serviceId={service.isDefault ? null : service.id}
            title={`Ask about ${service.title}`}
            intro="Not ready to book? Send your question and we will reply personally."
          />
        </div>
      </Container>
    </article>
  );
}
