import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/site/Backdrop";
import { Testimonials } from "@/components/site/HomeSections";
import { ButtonLink, Container } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getPageContent, getSettings, getTestimonials, sectionByKey } from "@/lib/data";
import { safeHref } from "@/lib/utils";

// Re-read the database at most once a minute so admin edits show up without a redeploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Client reviews",
  description: "Verified reviews from clients of Karmic Ascension – Vedic Astrology.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const [page, items, settings] = await Promise.all([getPageContent("home"), getTestimonials(), getSettings()]);
  if (page.notFound) notFound();
  const testi = sectionByKey(page.sections, "testimonials");
  const bookable = getBookingMode().enabled;
  return (
    <>
      {testi && items.length > 0 ? (
        <Testimonials s={testi} items={items} asH1 />
      ) : (
        <section className="py-20 text-center">
          <Container narrow>
            <h1 className="text-4xl text-maroon">Client reviews</h1>
            <p className="mt-4 text-lg text-ink-soft">Verified reviews will appear here soon.</p>
          </Container>
        </section>
      )}
      {settings.astrosage_url && (
        <section className="pb-6 text-center">
          <Container narrow>
            <p className="text-ink-soft">Neelabh Shivam is also listed on AstroSage, where clients leave public ratings.</p>
            <a
              href={safeHref(settings.astrosage_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full border border-gold bg-white-warm px-7 font-semibold text-maroon hover:bg-parchment"
            >
              Read reviews on AstroSage
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Container>
        </section>
      )}
      <section className="relative isolate overflow-hidden py-14 text-center sm:py-20">
        <Backdrop />
        <Container narrow>
          <p className="font-serif text-2xl text-maroon sm:text-3xl">Ready when you are.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={bookable ? "/book" : "/contact"} size="lg">
              {bookable ? "Book a consultation" : "Contact us"}
            </ButtonLink>
            <ButtonLink href="/services" variant="secondary" size="lg">
              View consultations
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
