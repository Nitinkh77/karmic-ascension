import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { RASHIS, rashiBySlug } from "@/lib/astro/constants";
import { readingFor, skyForDate, todayIst } from "@/lib/astro/horoscope";
import { getBookingMode } from "@/lib/booking/config";

export const revalidate = 1800;

type Props = { params: Promise<{ rashi: string }> };

export function generateStaticParams() {
  return RASHIS.map((r) => ({ rashi: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = rashiBySlug((await params).rashi);
  if (!r) return { title: "Horoscope not found", robots: { index: false } };
  return {
    title: `${r.sanskrit} (${r.english}) daily horoscope`,
    description: `Today's ${r.sanskrit} rashi horoscope for ${r.english} Moon sign, from the Moon's actual transit (Chandra Gochar).`,
    alternates: { canonical: `/horoscope/${r.slug}` },
  };
}

const tone = { supportive: "green", mixed: "saffron", careful: "grey" } as const;

export default async function RashiPage({ params }: Props) {
  const r = rashiBySlug((await params).rashi);
  if (!r) notFound();

  const date = todayIst();
  const sky = skyForDate(date);
  const { house, reading } = readingFor(r.n, sky);
  const prev = RASHIS[(r.n + 10) % 12];
  const next = RASHIS[r.n % 12];
  const pretty = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const bookable = getBookingMode().enabled;

  const sections: Array<[string, string]> = [
    ["Work and money", reading.work],
    ["Relationships", reading.relationships],
    ["Health and wellbeing", reading.wellbeing],
  ];

  return (
    <>
      <PageHero eyebrow={`${r.english} · ${pretty}`} title={`${r.sanskrit} ${r.symbol} daily horoscope`} description={reading.title} />
      <article className="pb-20 pt-4">
        <Container narrow>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-sm">
            <Badge tone={tone[reading.tone]}>{reading.tone} day</Badge>
            <span className="rounded-full border border-gold-soft bg-white-warm px-3 py-1 text-ink-soft">Moon in {sky.moonRashi.sanskrit}, {house}{ordinal(house)} from your sign</span>
            <span className="rounded-full border border-gold-soft bg-white-warm px-3 py-1 text-ink-soft">{sky.moonNakshatra} nakshatra</span>
            <span className="rounded-full border border-gold-soft bg-white-warm px-3 py-1 text-ink-soft">{sky.paksha} {sky.tithi}</span>
          </div>

          <div className="ornate-frame rounded-2xl p-7 sm:p-9">
            <h2 className="text-2xl text-maroon">Today at a glance</h2>
            <p className="mt-3 text-lg text-charcoal">{reading.overview}</p>
            <dl className="mt-7 grid gap-6 sm:grid-cols-3">
              {sections.map(([label, text]) => (
                <div key={label}>
                  <dt className="eyebrow">{label}</dt>
                  <dd className="mt-2 text-ink-soft">{text}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 rounded-xl bg-parchment p-4 text-charcoal"><span className="font-semibold text-maroon">Tip for today: </span>{reading.tip}</p>
          </div>

          <p className="mt-6 text-sm text-ink-soft">
            {r.sanskrit} is ruled by {planetName(r.lord)} and is a {r.element.toLowerCase()} sign. This reading follows the Moon&apos;s transit from your Moon sign (Chandra Gochar). It is general guidance for reflection and not a prediction of events.
          </p>

          <nav aria-label="Other signs" className="mt-10 flex items-center justify-between gap-4">
            <Link href={`/horoscope/${prev.slug}`} className="spring inline-flex min-h-11 items-center gap-2 rounded-full border border-gold bg-white-warm px-5 text-sm font-semibold text-maroon">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {prev.sanskrit}
            </Link>
            <Link href="/horoscope" className="text-sm font-semibold text-maroon underline underline-offset-2">All signs</Link>
            <Link href={`/horoscope/${next.slug}`} className="spring inline-flex min-h-11 items-center gap-2 rounded-full border border-gold bg-white-warm px-5 text-sm font-semibold text-maroon">
              {next.sanskrit} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>

          <div className="ornate-frame mt-14 rounded-3xl bg-parchment p-8 text-center sm:p-10">
            <h2 className="text-2xl text-maroon sm:text-3xl">Want guidance for your own chart?</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">A daily reading looks only at the Moon. A consultation studies your whole birth chart and your questions.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={bookable ? "/book" : "/contact"} size="lg">{bookable ? "Book a consultation" : "Contact us"}</ButtonLink>
              <ButtonLink href="/kundali" variant="secondary" size="lg">Create your kundali</ButtonLink>
            </div>
          </div>
        </Container>
      </article>
    </>
  );
}

const ordinal = (n: number) => (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
const LORDS: Record<string, string> = { Su: "the Sun", Mo: "the Moon", Ma: "Mars", Me: "Mercury", Ju: "Jupiter", Ve: "Venus", Sa: "Saturn" };
const planetName = (id: string) => LORDS[id] ?? id;
