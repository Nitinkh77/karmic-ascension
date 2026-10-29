import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { MatchingTool } from "@/components/site/MatchingTool";
import { PageHero } from "@/components/site/PageHero";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kundli matching (Guna Milan)",
  description: "Free online kundli matching for marriage: the traditional 36-point Ashtakoota Guna Milan, Nadi, Bhakoot and Gana doshas, and a Manglik check.",
  alternates: { canonical: "/kundli-matching" },
};

const KOOTAS: Array<[string, string, string]> = [
  ["Varna", "1", "Spiritual outlook"],
  ["Vashya", "2", "Mutual attraction"],
  ["Tara", "3", "Health and well-being"],
  ["Yoni", "4", "Physical compatibility"],
  ["Graha Maitri", "5", "Mental friendship"],
  ["Gana", "6", "Temperament"],
  ["Bhakoot", "7", "Emotional bond, family welfare"],
  ["Nadi", "8", "Health and genes"],
];

export default async function KundliMatchingPage() {
  const settings = await getSettings();
  const wa = whatsappLink(settings.whatsapp_number, "Namaste, I matched two kundlis on your website and would like it read.");
  return (
    <>
      <PageHero
        eyebrow="Free tool"
        title="Kundli matching"
        description="Enter the birth details of the groom and the bride to see the traditional 36-point Guna Milan, the main doshas and a Manglik check."
      />
      <section className="pb-20 pt-4">
        <Container>
          <MatchingTool whatsappHref={wa} />
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-2xl text-maroon">The eight kootas</h2>
            <p className="mt-2 text-ink-soft">Guna Milan compares the Moon sign and nakshatra of two people and awards up to 36 points across eight areas of married life.</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {KOOTAS.map(([name, pts, about]) => (
                <li key={name} className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-white-warm px-4 py-3">
                  <span>
                    <span className="block font-semibold text-maroon">{name}</span>
                    <span className="text-sm text-ink-soft">{about}</span>
                  </span>
                  <span className="shrink-0 font-serif text-xl text-saffron-deep">{pts}</span>
                </li>
              ))}
            </ul>
            <h2 className="mt-10 text-2xl text-maroon">What a good score means</h2>
            <p className="mt-2 text-ink-soft">Below 18 is traditionally not advised, 18 to 24 is acceptable, 25 to 32 is good and 33 or more is excellent. A high score does not guarantee a happy marriage and a low score does not rule one out: the full charts, dashas and the strength of any dosha matter far more.</p>
            <h2 className="mt-10 text-2xl text-maroon">Accurate birth time matters</h2>
            <p className="mt-2 text-ink-soft">The score depends on the Moon, which moves about 13 degrees a day, so a wrong date or an error of several hours can change the nakshatra. Use the time from the birth certificate if you can.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
