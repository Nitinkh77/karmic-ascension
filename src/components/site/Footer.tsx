import Link from "next/link";
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Clock,
} from "lucide-react";

import { Emblem, ScallopBand } from "@/components/art/Ornaments";
import { splitBrand } from "@/components/site/Header";
import { Container } from "@/components/ui";
import { GANESH_INVOCATION } from "@/lib/defaults";
import type { SiteSettings } from "@/lib/types";
import { whatsappLink } from "@/lib/utils";

export function Footer({ settings }: { settings: SiteSettings }) {
  const [line1, line2] = splitBrand(settings.brand_name);
  const wa = whatsappLink(settings.whatsapp_number);

  const year = new Date().getFullYear();
  const footerText = settings.footer_text?.trim();

  const copyright = footerText
    ? footerText.startsWith("©") && !/\d{4}/.test(footerText)
      ? `© ${year}${footerText.slice(1)}`
      : footerText
    : `© ${year} ${settings.brand_name}`;

  return (
    <footer className="mt-24 border-t border-gold-soft bg-parchment">
      <ScallopBand className="-mt-px text-ivory" />

      <Container className="grid gap-10 py-14 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Emblem className="h-12 w-12" />

            <div className="leading-tight">
              <p className="font-serif text-2xl font-semibold text-maroon">
                {line1}
              </p>

              {line2 && (
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-saffron-deep">
                  {line2}
                </p>
              )}
            </div>
          </div>

          <p className="mt-5 max-w-sm text-ink-soft">
            {settings.tagline}
          </p>

          <p className="deva mt-5 text-lg text-maroon" lang="sa">
            {GANESH_INVOCATION}
          </p>
        </div>

        {/* Explore and policies */}
        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="eyebrow mb-4 font-sans">Explore</h2>

          <ul className="space-y-2.5">
            {[
              ["/", "Home"],
              ["/services", "Astrology consultations"],
              ["/about", "About Neelabh Shivam"],
              ["/book", "Book a session"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-charcoal hover:text-maroon hover:underline"
                >
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
                <Link
                  href={href}
                  className="text-charcoal hover:text-maroon hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact information */}
        <div className="md:col-span-4">
          <h2 className="eyebrow mb-4 font-sans">Contact</h2>

          <ul className="space-y-3 text-charcoal">
            {settings.contact_phone && (
              <li className="flex items-start gap-3">
                <Phone
                  className="mt-1 h-4 w-4 shrink-0 text-gold-deep"
                  aria-hidden="true"
                />

                <a
                  href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`}
                  className="hover:text-maroon hover:underline"
                >
                  {settings.contact_phone}
                </a>
              </li>
            )}

            {wa && (
              <li className="flex items-start gap-3">
                <MessageCircle
                  className="mt-1 h-4 w-4 shrink-0 text-gold-deep"
                  aria-hidden="true"
                />

                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-maroon hover:underline"
                >
                  WhatsApp
                </a>
              </li>
            )}

            {settings.contact_email && (
              <li className="flex items-start gap-3">
                <Mail
                  className="mt-1 h-4 w-4 shrink-0 text-gold-deep"
                  aria-hidden="true"
                />

                <a
                  href={`mailto:${settings.contact_email}`}
                  className="break-all hover:text-maroon hover:underline"
                >
                  {settings.contact_email}
                </a>
              </li>
            )}

            {settings.address && (
              <li className="flex items-start gap-3">
                <MapPin
                  className="mt-1 h-4 w-4 shrink-0 text-gold-deep"
                  aria-hidden="true"
                />
                <span>{settings.address}</span>
              </li>
            )}

            {settings.hours_text && (
              <li className="flex items-start gap-3">
                <Clock
                  className="mt-1 h-4 w-4 shrink-0 text-gold-deep"
                  aria-hidden="true"
                />
                <span>{settings.hours_text}</span>
              </li>
            )}
          </ul>
        </div>
      </Container>

      {/* Copyright */}
      <div className="border-t border-gold-soft">
        <Container className="flex flex-col items-start justify-between gap-2 py-5 text-sm text-ink-soft sm:flex-row sm:items-center">
          <p>{copyright}</p>

          <p>
            Consultations are for guidance and reflection; no outcome is
            guaranteed.
          </p>
        </Container>
      </div>
    </footer>
  );
} 