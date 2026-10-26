import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Container } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { RASHIS } from "@/lib/astro/constants";
import { readingFor, skyForDate, todayIst } from "@/lib/astro/horoscope";

// The Moon's position is recalculated at most every 30 minutes; a day's reading is fixed to 06:00 IST.
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Daily horoscope",
  description: "Today's Vedic horoscope for all twelve Moon signs, calculated from the Moon's actual position and the classical Chandra Gochar method.",
  alternates: { canonical: "/horoscope" },
};

const tone = { supportive: "green", mixed: "saffron", careful: "grey" } as const;

export default function HoroscopePage() {
  const date = todayIst();
  const sky = skyForDate(date);
  const pretty = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <>
      <PageHero eyebrow="Daily horoscope" title={`Rashifal for ${pretty}`} description={`The Moon is in ${sky.moonRashi.sanskrit} (${sky.moonRashi.english}) in ${sky.moonNakshatra} nakshatra. Tithi: ${sky.paksha} ${sky.tithi}.`} />
      <section className="pb-20 pt-4">
        <Container>
          <p className="mx-auto max-w-2xl text-center text-ink-soft">
            Find your <strong className="text-charcoal">Moon sign</strong> (rashi), not your Sun sign, and tap it for today&apos;s reading. Not sure of your Moon sign? <Link href="/kundali" className="font-semibold text-maroon underline underline-offset-2">Create your kundali</Link>.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RASHIS.map((r, i) => {
              const { reading } = readingFor(r.n, sky);
              return (
                <li key={r.slug}>
                  <Reveal delay={(i % 3) * 0.05} className="h-full">
                    <Link href={`/horoscope/${r.slug}`} className="spring ornate-frame group flex h-full flex-col rounded-2xl p-6">
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-parchment font-serif text-2xl text-maroon" aria-hidden="true">{r.symbol}</span>
                          <span>
                            <span className="block font-serif text-2xl font-semibold text-maroon">{r.sanskrit}</span>
                            <span className="block text-sm text-ink-soft">{r.english}</span>
                          </span>
                        </span>
                        <Badge tone={tone[reading.tone]}>{reading.tone}</Badge>
                      </span>
                      <span className="mt-4 flex-1 text-ink-soft">{reading.title}.</span>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-maroon">
                        Read today&apos;s horoscope <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
          <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-ink-soft">
            Readings are based on the Moon&apos;s transit from your Moon sign (Chandra Gochar) and are general guidance for reflection, not predictions of events. For guidance based on your full birth chart, book a consultation.
          </p>
        </Container>
      </section>
    </>
  );
}
