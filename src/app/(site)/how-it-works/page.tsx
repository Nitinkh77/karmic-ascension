import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/site/Backdrop";
import { Process, Why } from "@/components/site/HomeSections";
import { ButtonLink, Container } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getPageContent, sectionByKey } from "@/lib/data";

// Re-read the database at most once a minute so admin edits show up without a redeploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "How it works",
  description: "How a Vedic astrology consultation works, step by step, and why people choose Karmic Ascension.",
  alternates: { canonical: "/how-it-works" },
};

export default async function HowItWorksPage() {
  const page = await getPageContent("home");
  if (page.notFound) notFound();
  const why = sectionByKey(page.sections, "why");
  const process = sectionByKey(page.sections, "process");
  const bookable = getBookingMode().enabled;
  return (
    <>
      {process && <Process s={process} asH1 />}
      {why && <Why s={why} />}
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
