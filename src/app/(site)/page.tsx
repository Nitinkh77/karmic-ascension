import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreTiles, HomeGallery, HomeReviews, Hero, Intro } from "@/components/site/HomeSections";
import { getBookingMode } from "@/lib/booking/config";
import {
  getFeaturedServices,
  getPageContent,
  getServices,
  getSettings,
  getTestimonials,
  sectionByKey,
} from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

// Re-read the database at most once a minute so admin edits show up without a redeploy.
export const revalidate = 60;

export const generateMetadata = (): Promise<Metadata> => pageMetadata("home", "/");

export default async function HomePage() {
  const [page, settings, services, allServices, reviews] = await Promise.all([
    getPageContent("home"),
    getSettings(),
    getFeaturedServices(),
    getServices(),
    getTestimonials(),
  ]);
  if (page.notFound) notFound();

  const bookable = getBookingMode().enabled && services.length > 0;
  const sec = (key: string) => sectionByKey(page.sections, key);

  const hero = sec("hero");
  const intro = sec("intro");

  return (
    <>
      {hero && <Hero s={hero} settings={settings} bookable={bookable} />}
      {intro && <Intro s={intro} />}
      <HomeGallery services={allServices} />
      <ExploreTiles />
      <HomeReviews items={reviews} settings={settings} />
    </>
  );
}
