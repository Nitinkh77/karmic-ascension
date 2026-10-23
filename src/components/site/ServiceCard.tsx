import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { ImageSlot } from "@/components/site/ImageSlot";
import { ButtonLink } from "@/components/ui";
import type { Service } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/utils";

/** Price in rupees (converted from paise) or "Price on request" when the price is NULL. */
export function PriceTag({ service }: { service: Pick<Service, "price_paise" | "currency"> }) {
  const price = formatPrice(service.price_paise, service.currency);
  return price ? (
    <span className="font-serif text-2xl font-semibold text-maroon">{price}</span>
  ) : (
    <span className="text-base font-semibold text-ink-soft">Price on request</span>
  );
}

export function ServiceCard({ service, bookable }: { service: Service; bookable: boolean }) {
  return (
    <article className="ornate-frame group flex h-full flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-lift">
      <ImageSlot
        src={service.imageUrl}
        alt={service.imageAlt || service.title}
        className="aspect-[16/10] w-full rounded-none border-0 shadow-none before:hidden"
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl text-maroon">
          <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 hover:underline">
            {service.title}
          </Link>
        </h3>
        {service.short_description && <p className="mt-2 flex-1 text-ink-soft">{service.short_description}</p>}
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-sand pt-4">
          <div>
            <PriceTag service={service} />
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDuration(service.duration_minutes)}
            </p>
          </div>
          <span className="relative z-10 inline-flex items-center gap-1 text-sm font-semibold text-maroon">
            Details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
        {/* The booking link carries the service slug; /book pre-selects that service. */}
        {bookable ? (
          <ButtonLink href={`/book?service=${encodeURIComponent(service.slug)}`} size="md" className="relative z-10 mt-4 w-full">
            Book This Service
          </ButtonLink>
        ) : (
          <ButtonLink href="/contact" variant="secondary" size="md" className="relative z-10 mt-4 w-full">
            Contact to book
          </ButtonLink>
        )}
      </div>
    </article>
  );
}

/** 1 column on mobile, 2 on tablet, 3 on desktop. A short last row is centred. */
export function ServicesGrid({ services, bookable }: { services: Service[]; bookable: boolean }) {
  return (
    <ul className="flex flex-wrap justify-center gap-6">
      {services.map((s) => (
        <li key={s.id} className="flex w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
          <div className="w-full">
            <ServiceCard service={s} bookable={bookable} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Placeholder shown by loading.tsx while the page streams in. Same footprint as a real card. */
export function ServiceCardSkeleton() {
  return (
    <div className="ornate-frame h-full overflow-hidden rounded-2xl" aria-hidden="true">
      <div className="aspect-[16/10] w-full animate-pulse bg-parchment" />
      <div className="space-y-3 p-6">
        <div className="h-7 w-3/4 animate-pulse rounded bg-sand" />
        <div className="h-4 w-full animate-pulse rounded bg-parchment" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-parchment" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-sand" />
      </div>
    </div>
  );
}
