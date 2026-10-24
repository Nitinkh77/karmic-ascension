import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/site/Backdrop";
import { Faqs } from "@/components/site/HomeSections";
import { ButtonLink, Container } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getFaqs, getPageContent, sectionByKey } from "@/lib/data";

// Re-read the database at most once a minute so admin edits show up without a redeploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about birth details, timing, payment and rescheduling for Vedic astrology consultations.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [page, faqs] = await Promise.all([getPageContent("home"), getFaqs(null)]);
  if (page.notFound) notFound();
  const faq = sectionByKey(page.sections, "faqs");
  const bookable = getBookingMode().enabled;
  return (
    <>
      {faq && faqs.length > 0 ? (
        <Faqs s={faq} faqs={faqs} asH1 />
      ) : (
        <section className="py-20 text-center">
          <Container narrow>
            <h1 className="text-4xl text-maroon">Frequently asked questions</h1>
            <p className="mt-4 text-lg text-ink-soft">Questions and answers will appear here soon.</p>
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
