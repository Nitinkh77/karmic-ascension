import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AboutTeaser,
  Faqs,
  FinalCta,
  Hero,
  Intro,
  Prayer,
  Process,
  ServicesSection,
  Testimonials,
  Why,
} from "@/components/site/HomeSections";
import { getBookingMode } from "@/lib/booking/config";
import {
  getFaqs,
  getFeaturedServices,
  getPageContent,
  getSettings,
  getTestimonials,
  sectionByKey,
} from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("home", "/");

export default async function HomePage() {
  const [page, settings, services, faqs, testimonials] = await Promise.all([
    getPageContent("home"),
    getSettings(),
    getFeaturedServices(),
    getFaqs(null),
    getTestimonials(),
  ]);
  if (page.notFound) notFound();

  const bookable = getBookingMode().enabled && services.length > 0;
  const data = { settings, services, faqs, testimonials, bookable };
  const sec = (key: string) => sectionByKey(page.sections, key);

  const hero = sec("hero");
  const intro = sec("intro");
  const svc = sec("services");
  const prayer = sec("prayer");
  const why = sec("why");
  const process = sec("process");
  const about = sec("about");
  const testi = sec("testimonials");
  const faq = sec("faqs");
  const cta = sec("cta");

  return (
    <>
      {hero && <Hero s={hero} settings={settings} bookable={bookable} />}
      {intro && <Intro s={intro} />}
      {svc && <ServicesSection s={svc} data={data} />}
      {prayer && <Prayer s={prayer} />}
      {why && <Why s={why} />}
      {process && <Process s={process} />}
      {about && <AboutTeaser s={about} />}
      {testi && <Testimonials s={testi} items={testimonials} />}
      {faq && <Faqs s={faq} faqs={faqs} />}
      {cta && <FinalCta s={cta} settings={settings} bookable={bookable} />}
    </>
  );
}
