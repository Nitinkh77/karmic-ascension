import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { Container, RichText, SectionHeading } from "@/components/ui";
import { getPageContent, getSettings, sectionByKey } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/utils";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("contact", "/contact");

export default async function ContactPage() {
  const [page, s] = await Promise.all([getPageContent("contact"), getSettings()]);
  if (page.notFound) notFound();
  const intro = sectionByKey(page.sections, "contact_intro");
  const wa = whatsappLink(s.whatsapp_number, "Namaste, I would like to ask about a consultation.");

  const rows: Array<{ Icon: LucideIcon; label: string; node: React.ReactNode }> = [];
  if (s.contact_phone)
    rows.push({
      Icon: Phone,
      label: "Phone",
      node: <a className="hover:underline" href={`tel:${s.contact_phone.replace(/[^\d+]/g, "")}`}>{s.contact_phone}</a>,
    });
  if (wa)
    rows.push({
      Icon: MessageCircle,
      label: "WhatsApp",
      node: (
        <a className="hover:underline" href={wa} target="_blank" rel="noopener noreferrer">
          Message on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
        </a>
      ),
    });
  if (s.contact_email)
    rows.push({
      Icon: Mail,
      label: "Email",
      node: <a className="break-all hover:underline" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>,
    });
  if (s.address) rows.push({ Icon: MapPin, label: "Location", node: s.address });
  if (s.hours_text) rows.push({ Icon: Clock, label: "Consultation hours (IST)", node: s.hours_text });

  return (
    <section className="py-14 sm:py-20">
      <Container narrow>
        <SectionHeading as="h1" eyebrow={intro?.eyebrow} title={intro?.heading ?? "Contact"} description={intro?.body} />
        <dl className="ornate-frame mt-12 divide-y divide-sand rounded-2xl">
          {rows.map(({ Icon, label, node }) => (
            <div key={label} className="flex items-start gap-4 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold bg-parchment text-maroon">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-1 text-lg text-charcoal">{node}</dd>
              </div>
            </div>
          ))}
        </dl>
        {rows.length === 0 && (
          <p className="mt-10 text-center text-ink-soft">Contact details will be added soon.</p>
        )}
        <RichText text={s.booking_policy_text} className="mt-10" />
      </Container>
    </section>
  );
}
