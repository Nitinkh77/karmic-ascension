import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mandala } from "@/components/art/Mandala";
import { ImageSlot } from "@/components/site/ImageSlot";
import { ButtonLink, Container, RichText } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getPageContent, getSettings } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("about", "/about");

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getPageContent("about"), getSettings()]);
  if (page.notFound) notFound();
  const bookable = getBookingMode().enabled;
  const visible = page.sections.filter((s) => s.isVisible && (s.heading || s.body));

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <ImageSlot
              src={visible.find((s) => s.imageUrl)?.imageUrl}
              alt={visible.find((s) => s.imageUrl)?.imageAlt || "Neelabh Shivam"}
              shape="arch"
              priority
              className="mx-auto aspect-[4/5] w-full max-w-sm lg:sticky lg:top-28"
              sizes="(min-width: 1024px) 30vw, 80vw"
            />
          </div>
          <div className="lg:col-span-8">
            {visible.map((s, i) => (
              <div key={s.key} className={i > 0 ? "mt-12" : undefined}>
                {s.eyebrow && <p className="eyebrow mb-3">{s.eyebrow}</p>}
                {s.heading &&
                  (i === 0 ? (
                    <h1 className="text-4xl text-maroon sm:text-5xl">{s.heading}</h1>
                  ) : (
                    <h2 className="text-3xl text-maroon">{s.heading}</h2>
                  ))}
                <RichText text={s.body} className="mt-5 text-lg" />
              </div>
            ))}
            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              {bookable ? (
                <ButtonLink href="/book" size="lg">
                  Book a consultation
                </ButtonLink>
              ) : (
                <ButtonLink href="/contact" size="lg">
                  Contact
                </ButtonLink>
              )}
              <ButtonLink href="/services" variant="secondary" size="lg">
                View consultations
              </ButtonLink>
            </div>
            {settings.address && <p className="mt-6 text-sm text-ink-soft">Based in {settings.address}</p>}
          </div>
        </div>
        <Mandala className="mx-auto mt-20 h-24 w-24 text-gold-soft" />
      </Container>
    </section>
  );
}
