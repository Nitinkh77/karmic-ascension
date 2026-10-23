import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { OrnamentDivider } from "@/components/art/Ornaments";
import { ServicesGrid } from "@/components/site/ServiceCard";
import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getPageContent, getServicesResult, sectionByKey } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("services", "/services");

export default async function ServicesPage() {
  const [page, { services, error }] = await Promise.all([getPageContent("services"), getServicesResult()]);
  if (page.notFound) notFound();
  const intro = sectionByKey(page.sections, "services_intro");
  const bookable = getBookingMode().enabled;

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow={intro?.eyebrow}
          title={intro?.heading ?? page.meta.title}
          description={intro?.body}
        />
        <OrnamentDivider className="my-10" />

        {error ? (
          <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-danger/40 bg-red-50 p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-danger" aria-hidden="true" />
            <h2 className="mt-3 text-2xl text-maroon">We could not load the services</h2>
            <p className="mt-2 text-ink-soft">
              This is a temporary problem on our side. Please refresh the page, or contact us and we will help you
              book directly.
            </p>
            <ButtonLink href="/contact" className="mt-5">
              Contact us
            </ButtonLink>
          </div>
        ) : services.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gold bg-white-warm p-8 text-center">
            <h2 className="text-2xl text-maroon">No services are open for booking yet</h2>
            <p className="mt-2 text-ink-soft">Please check back soon, or get in touch to enquire.</p>
            <ButtonLink href="/contact" variant="secondary" className="mt-5">
              Contact us
            </ButtonLink>
          </div>
        ) : (
          <ServicesGrid services={services} bookable={bookable} />
        )}
      </Container>
    </section>
  );
}
