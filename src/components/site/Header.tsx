import Link from "next/link";
import { Emblem } from "@/components/art/Ornaments";
import { DesktopNav } from "@/components/site/DesktopNav";
import { MobileNav } from "@/components/site/MobileNav";
import { AccountLink } from "@/components/site/AccountLink";
import { Container } from "@/components/ui";

export interface NavChild {
  href: string;
  label: string;
  description?: string;
}
export interface NavItem {
  label: string;
  href?: string;
  children?: NavChild[];
}

export const NAV_LINKS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  {
    label: "Free Tools",
    children: [
      { href: "/horoscope", label: "Daily Horoscope", description: "Today's guidance for your Moon sign" },
      { href: "/kundali", label: "Free Kundali", description: "Your birth chart, nakshatra and dasha" },
      { href: "/kundli-matching", label: "Kundli Matching", description: "36-point Guna Milan for marriage" },
    ],
  },
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** "Karmic Ascension – Vedic Astrology™" → two lines for the logo lockup. */
export function splitBrand(name: string): [string, string | null] {
  const i = name.search(/\s[–—-]\s/);
  if (i === -1) return [name, null];
  return [name.slice(0, i), name.slice(i).replace(/^\s[–—-]\s/, "")];
}

export function Header({ brandName }: { brandName: string }) {
  const [line1, line2] = splitBrand(brandName);
  return (
    <header className="sticky top-0 z-30 border-b border-gold-soft bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${brandName} – home`}>
          <Emblem className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <span className="whitespace-nowrap leading-tight">
            <span className="block font-serif text-xl font-semibold text-maroon sm:text-2xl">{line1}</span>
            {line2 && (
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-saffron-deep">
                {line2}
              </span>
            )}
          </span>
        </Link>

        <DesktopNav links={NAV_LINKS} />

        <div className="hidden xl:block"><AccountLink /></div>
        <MobileNav links={NAV_LINKS} />
      </Container>
    </header>
  );
}
