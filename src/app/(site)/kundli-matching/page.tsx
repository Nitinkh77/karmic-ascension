import type { Metadata } from "next";
import { CalendarClock, Heart, Lock, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { OrnamentDivider } from "@/components/art/Ornaments";
import { Backdrop } from "@/components/site/Backdrop";
import { MatchingTool } from "@/components/site/MatchingTool";
import { Container } from "@/components/ui";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kundli matching (Guna Milan)",
  description: "Free online kundli matching for marriage: the traditional 36-point Ashtakoota Guna Milan, Nadi, Bhakoot and Gana doshas, and a Manglik check.",
  alternates: { canonical: "/kundli-matching" },
};

const KOOTAS: Array<[string, string, string]> = [
  ["Varna", "1", "Spiritual outlook and ego"],
  ["Vashya", "2", "Mutual attraction and influence"],
  ["Tara", "3", "Health and well-being"],
  ["Yoni", "4", "Physical compatibility"],
  ["Graha Maitri", "5", "Mental friendship"],
  ["Gana", "6", "Temperament"],
  ["Bhakoot", "7", "Emotional bond and family welfare"],
  ["Nadi", "8", "Health, genes and energy balance"],
];

const FAQS: Array<[string, string]> = [
  ["What is Guna Milan?", "Guna Milan, also called Ashtakoota, is the traditional Vedic method of comparing two people's Moon sign and birth star. It awards up to 36 points across eight areas of married life: temperament, mental and physical compatibility, health, family welfare and more."],
  ["What is a good Guna Milan score?", "Below 18 is traditionally not advised, 18 to 24 is acceptable, 25 to 32 is good and 33 or more is excellent. The score is a starting point. The full charts, the dashas and the strength of any dosha matter far more than the number."],
  ["Is Nadi dosha serious?", "Nadi carries the highest weight (8 points), so the same Nadi on both sides is looked at closely. Traditional texts also list several cancellations, for example when the Moon signs or birth stars differ in certain ways. A consultation can tell you whether it applies to your charts."],
  ["Do I need the exact time of birth?", "The score depends on the Moon, which moves about 13 degrees a day, so a wrong date or an error of several hours can change the birth star. The Manglik check uses the Lagna as well, which changes sign roughly every two hours, so use the time on the birth certificate if you can."],
  ["Is my data saved?", "No. The birth details are used for this one calculation and are not stored."],
];

export default async function KundliMatchingPage() {
  const settings = await getSettings();
  const wa = whatsappLink(settings.whatsapp_number, "Namaste, I matched two kundlis on your website and would like it read.");
  return (
    <>
      <section className="relative isolate overflow-hidden pb-4 pt-12 text-center sm:pt-16">
        <Backdrop />
        <Container narrow>
          <p className="eyebrow mb-3">Free tool · Guna Milan</p>
          <h1 className="text-4xl text-maroon sm:text-5xl">Kundli matching</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
            Compare two birth charts with the traditional 36-point Ashtakoota method, and check Nadi, Bhakoot, Gana and Manglik doshas in one place.
          </p>

          <div className="mx-auto mt-8 flex max-w-sm items-center justify-center" aria-hidden="true">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-maroon to-[#8c2a3c] text-ivory shadow-lift">
              <UserRound className="h-8 w-8" />
            </span>
            <span className="h-px w-12 bg-gradient-to-r from-maroon to-gold sm:w-20" />
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold bg-white-warm text-saffron shadow-lift">
              <Heart className="h-6 w-6 fill-current" />
            </span>
            <span className="h-px w-12 bg-gradient-to-r from-gold to-saffron-deep sm:w-20" />
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-lift">
              <UserRound className="h-8 w-8" />
            </span>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2.5 text-sm">
            {[
              [Sparkles, "36-point Ashtakoota"],
              [ShieldCheck, "Dosha and Manglik check"],
              [Lock, "Private, never saved"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Sparkles;
              return (
                <li key={label as string} className="inline-flex items-center gap-2 rounded-full border border-gold-soft bg-white-warm px-4 py-2 text-charcoal">
                  <I className="h-4 w-4 text-saffron" aria-hidden="true" />
                  {label as string}
                </li>
              );
            })}
          </ul>
          <OrnamentDivider className="mt-8" />
        </Container>
      </section>

      <section className="pb-16 pt-6">
        <Container>
          <MatchingTool whatsappHref={wa} />
        </Container>
      </section>

      <section className="bg-white-warm py-14 sm:py-20" aria-label="How kundli matching works">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-2">How it works</p>
            <h2 className="text-3xl text-maroon sm:text-4xl">Three simple steps</h2>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [UserRound, "Enter both birth details", "Date, time and place of birth for the groom and the bride."],
              [CalendarClock, "We read the Moon", "Each Moon sign and birth star is calculated with the Lahiri ayanamsa."],
              [Heart, "See the 36-point result", "Eight kootas, the doshas and the Manglik check, explained in plain words."],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Heart;
              return (
                <li key={title as string} className="ornate-frame relative rounded-2xl p-6 text-center">
                  <span className="absolute -top-4 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-maroon text-sm font-semibold text-ivory">{i + 1}</span>
                  <I className="mx-auto mt-2 h-8 w-8 text-saffron" aria-hidden="true" />
                  <h3 className="mt-3 text-xl text-maroon">{title as string}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{text as string}</p>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      <section className="py-14 sm:py-20" aria-label="The eight kootas">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-2">The method</p>
            <h2 className="text-3xl text-maroon sm:text-4xl">The eight kootas</h2>
            <p className="mt-3 text-ink-soft">Each koota looks at a different part of married life and carries its own points, adding up to 36.</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KOOTAS.map(([name, pts, about]) => (
              <li key={name} className="flex flex-col rounded-2xl border border-sand bg-white-warm p-5">
                <span className="font-serif text-4xl font-semibold text-saffron-deep">{pts}<span className="ml-1 text-sm font-normal text-ink-soft">{pts === "1" ? "point" : "points"}</span></span>
                <span className="mt-2 font-serif text-xl text-maroon">{name}</span>
                <span className="mt-1 text-sm text-ink-soft">{about}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white-warm py-14 sm:py-20" aria-label="Frequently asked questions">
        <Container narrow>
          <div className="text-center">
            <p className="eyebrow mb-2">Questions</p>
            <h2 className="text-3xl text-maroon sm:text-4xl">Kundli matching, answered</h2>
          </div>
          <div className="mt-8 space-y-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-sand bg-ivory">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-serif text-lg text-maroon [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold text-lg leading-none text-saffron-deep transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
                </summary>
                <p className="px-5 pb-5 text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
