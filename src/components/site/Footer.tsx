import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Clock } from "lucide-react";
import { Emblem, ScallopBand } from "@/components/art/Ornaments";
import { splitBrand } from "@/components/site/Header";
import { Facebook, Instagram, Youtube } from "@/components/site/SocialIcons";
import { Container } from "@/components/ui";
import { GANESH_INVOCATION } from "@/lib/defaults";
import type { SiteSettings } from "@/lib/types";
import { safeHref, whatsappLink } from "@/lib/utils";

export function Footer({ settings }: { settings: SiteSettings }) {
  const [line1, line2] = splitBrand(settings.brand_name);
  const wa = whatsappLink(settings.whatsapp_number);
  const socials = [
    { href: settings.instagram_url, label: "Instagram", Icon: Instagram },
    { href: settings.facebook_url, label: "Facebook", Icon: Facebook },
    { href: settings.youtube_url, label: "YouTube", Icon: Youtube },
  ].filter((s) => s.href);

  const year = new Date().getFullYear();
  const footerText = settings.footer_text?.trim();
  // Insert the current year after the © sign when the stored text starts with "©".
  const copyright = footerText
    ? footerText.startsWith("©") && !/\d{4}/.test(footerText)
      ? `© ${year}${footerText.slice(1)}`
      : footerText
    : `© ${year} ${settings.brand_name}`;

  return (
    <footer className="mt-24 border-t border-gold-soft bg-parchment">
      <ScallopBand className="-mt-px text-ivory" />
      <Container className="grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Emblem className="h-12 w-12" />
            <div className="leading-tight">
              <p className="font-serif text-2xl font-semibold text-maroon">{line1}</p>
              {line2 && (
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-saffron-deep">{line2}</p>
              )}
            </div>
          </div>
          <p className="mt-5 max-w-sm text-ink-soft">{settings.tagline}</p>
          <p className="deva mt-5 text-lg text-maroon" lang="sa">
            {GANESH_INVOCATION}
          </p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-3">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={safeHref(href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (opens in a new tab)`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-white-warm text-maroon transition-colors hover:bg-maroon hover:text-ivory"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="eyebrow mb-4 font-sans">Explore</h2>
          <ul className="space-y-2.5">
            {[
              ["/", "Home"],
              ["/services", "Astrology consultations"],
              ["/horoscope", "Daily horoscope"],
              ["/kundali", "Free Kundali"],
              ["/kundli-matching", "Kundli matching"],
              ["/how-it-works", "How it works"],
              ["/reviews", "Client reviews"],
              ["/about", "About Neelabh Shivam"],
              ["/faq", "FAQ"],
              ["/book", "Book a session"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-charcoal hover:text-maroon hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="eyebrow mb-4 mt-8 font-sans">Policies</h2>
          <ul className="space-y-2.5">
            {[
              ["/privacy", "Privacy policy"],
              ["/terms", "Terms and conditions"],
              ["/cancellation-refund", "Cancellation & rescheduling"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-charcoal hover:text-maroon hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="eyebrow mb-4 font-sans">Contact</h2>
          <ul className="space-y-3 text-charcoal">
            {settings.contact_phone && (
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                <a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`} className="hover:text-maroon hover:underline">
                  {settings.contact_phone}
                </a>
              </li>
            )}
            {wa && (
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-maroon hover:underline">
                  WhatsApp
                </a>
              </li>
            )}
            {settings.contact_email && (
              <li className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                <a href={`mailto:${settings.contact_email}`} className="break-all hover:text-maroon hover:underline">
                  {settings.contact_email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.hours_text && (
              <li className="flex items-start gap-3">
                <Clock className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                <span>{settings.hours_text}</span>
              </li>
            )}
          </ul>
        </div>
      </Container>
      <div className="border-t border-gold-soft">
        <Container className="flex flex-col items-start justify-between gap-2 py-5 text-sm text-ink-soft sm:flex-row sm:items-center">
          <p>{copyright}</p>
          <p>Consultations are for guidance and reflection; no outcome is guaranteed.</p>
        </Container>
      </div>
    </footer>
  );
}
