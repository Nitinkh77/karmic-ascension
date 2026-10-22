import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrnamentDivider } from "@/components/art/Ornaments";
import { ServiceCard } from "@/components/site/ServiceCard";
import { Container, SectionHeading } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getPageContent, getServices, sectionByKey } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("services", "/services");

export default async function ServicesPage() {
  const [page, services] = await Promise.all([getPageContent("services"), getServices()]);
  if (page.notFound) notFound();
  const intro = sectionByKey(page.sections, "services_intro");
  const bookable = getBookingMode().enabled;

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading as="h1" eyebrow={intro?.eyebrow} title={intro?.heading ?? page.meta.title} description={intro?.body} />
        <OrnamentDivider className="my-10" />
        {services.length === 0 ? (
          <p className="mx-auto max-w-md rounded-2xl border border-dashed border-gold bg-white-warm p-8 text-center text-ink-soft">
            No consultations are published yet. Please check back soon or get in touch.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {services.map((s) => (
              <div key={s.id} className="relative w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <ServiceCard service={s} bookable={bookable} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
