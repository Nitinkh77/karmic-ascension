import Link from "next/link";
import { Emblem } from "@/components/art/Ornaments";
import { MobileNav } from "@/components/site/MobileNav";
import { ButtonLink, Container } from "@/components/ui";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
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
      <Container className="relative flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link href="/" className="flex items-center gap-3" aria-label={`${brandName} – home`}>
          <Emblem className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <span className="leading-tight">
            <span className="block font-serif text-xl font-semibold text-maroon sm:text-2xl">{line1}</span>
            {line2 && (
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-saffron-deep">
                {line2}
              </span>
            )}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-parchment hover:text-maroon"
            >
              {l.label}
            </Link>
          ))}
          <ButtonLink href="/book" size="md" className="ml-3">
            Book a session
          </ButtonLink>
        </nav>

        <MobileNav links={NAV_LINKS} />
      </Container>
    </header>
  );
}
