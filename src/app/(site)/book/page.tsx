import type { Metadata } from "next";
import { OrnamentDivider } from "@/components/art/Ornaments";
import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import { BookingForm } from "@/app/(site)/book/BookingForm";
import { getBookingMode } from "@/lib/booking/config";
import { candidateDates } from "@/lib/booking/slots";
import { getAvailabilityRules, getServices, getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Choose a Vedic astrology consultation, pick an available time and submit your booking request.",
  alternates: { canonical: "/book" },
};

// Availability must be fresh; never statically cached.
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const mode = getBookingMode();
  const settings = await getSettings();
  const wa = whatsappLink(settings.whatsapp_number, "Namaste, I would like to book a consultation.");

  if (!mode.enabled) {
    return (
      <Container narrow className="py-20 text-center">
        <SectionHeading
          as="h1"
          eyebrow="Booking"
          title="Online booking is being set up"
          description="Booking opens once the site database is connected. Meanwhile, please contact us directly to arrange a consultation."
        />
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-maroon px-7 font-semibold text-ivory hover:bg-maroon-deep">
              WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <ButtonLink href="/contact" variant="secondary" size="lg">
            Contact details
          </ButtonLink>
        </div>
      </Container>
    );
  }

  const [services, rules] = await Promise.all([getServices(), getAvailabilityRules()]);
  const dates = candidateDates(rules, settings);

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Booking"
          title="Book a consultation"
          description="Choose your consultation, pick a time and share your details. It takes about two minutes."
        />
        <OrnamentDivider className="my-8" />
        {services.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gold bg-white-warm p-8 text-center text-ink-soft">
            No consultations are open for booking yet. Please contact us.
          </p>
        ) : (
          <BookingForm
            services={services}
            initialSlug={service ?? null}
            dates={dates}
            hoursText={settings.hours_text}
            policyText={settings.booking_policy_text}
            whatsappHref={wa}
          />
        )}
      </Container>
    </section>
  );
}
