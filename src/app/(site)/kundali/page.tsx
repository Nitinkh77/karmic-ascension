import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { KundaliTool } from "@/components/site/KundaliTool";
import { PageHero } from "@/components/site/PageHero";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Free kundali (birth chart)",
  description: "Create your Vedic birth chart online: Lagna, Moon sign, nakshatra, planet positions and Vimshottari dasha, calculated with the Lahiri ayanamsa.",
  alternates: { canonical: "/kundali" },
};

export default async function KundaliPage() {
  const settings = await getSettings();
  const wa = whatsappLink(settings.whatsapp_number, "Namaste, I created my kundali on your website and would like it read.");
  return (
    <>
      <PageHero
        eyebrow="Free tool"
        title="Create your kundali"
        description="Enter your birth details to see your Vedic birth chart: Lagna, Moon sign, nakshatra, planet positions and dasha periods."
      />
      <section className="pb-20 pt-4">
        <Container narrow>
          <KundaliTool whatsappHref={wa} />
          <div className="mt-16 grid gap-6 text-ink-soft sm:grid-cols-2">
            <div>
              <h2 className="text-2xl text-maroon">What you will see</h2>
              <p className="mt-2">The Lagna (rising sign), Moon sign and janma nakshatra, the nine grahas by sign, degree and house, the chart in North Indian style, and your Vimshottari dasha periods.</p>
            </div>
            <div>
              <h2 className="text-2xl text-maroon">How it is calculated</h2>
              <p className="mt-2">Sidereal zodiac (Lahiri ayanamsa), whole-sign houses and the mean lunar node. Planet positions come from an open-source astronomy library and are checked against published almanac data.</p>
            </div>
            <div className="sm:col-span-2">
              <h2 className="text-2xl text-maroon">A note on birth time</h2>
              <p className="mt-2">The Lagna changes sign roughly every two hours, so even a few minutes of error can matter. If your birth time is approximate, treat the Lagna and houses with caution; the Moon sign and nakshatra are far less sensitive. A consultation can check your time using life events.</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
