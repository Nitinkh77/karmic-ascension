import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AboutTeaser,
  ExploreTiles,
  FinalCta,
  Hero,
  Intro,
  Prayer,
  ServicesSection,
} from "@/components/site/HomeSections";
import { getBookingMode } from "@/lib/booking/config";
import {
  getFeaturedServices,
  getPageContent,
  getSettings,
  sectionByKey,
} from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

// Re-read the database at most once a minute so admin edits show up without a redeploy.
export const revalidate = 60;

export const generateMetadata = (): Promise<Metadata> => pageMetadata("home", "/");

export default async function HomePage() {
  const [page, settings, services] = await Promise.all([
    getPageContent("home"),
    getSettings(),
    getFeaturedServices(),
  ]);
  if (page.notFound) notFound();

  const bookable = getBookingMode().enabled && services.length > 0;
  // Process, reviews and FAQs now live on their own pages (/how-it-works, /reviews, /faq).
  const data = { settings, services, faqs: [], testimonials: [], bookable };
  const sec = (key: string) => sectionByKey(page.sections, key);

  const hero = sec("hero");
  const intro = sec("intro");
  const svc = sec("services");
  const prayer = sec("prayer");
  const about = sec("about");
  const cta = sec("cta");

  return (
    <>
      {hero && <Hero s={hero} settings={settings} bookable={bookable} />}
      {intro && <Intro s={intro} />}
      {svc && <ServicesSection s={svc} data={data} />}
      {prayer && <Prayer s={prayer} />}
      <ExploreTiles />
      {about && <AboutTeaser s={about} />}
      {cta && <FinalCta s={cta} settings={settings} bookable={bookable} />}
    </>
  );
}
