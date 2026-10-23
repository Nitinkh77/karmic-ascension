import { OrnamentDivider } from "@/components/art/Ornaments";
import { ServiceCardSkeleton } from "@/components/site/ServiceCard";
import { Container } from "@/components/ui";

export default function ServicesLoading() {
  return (
    <section className="py-14 sm:py-20" role="status" aria-live="polite">
      <span className="sr-only">Loading services…</span>
      <Container>
        <div className="mx-auto max-w-2xl space-y-4" aria-hidden="true">
          <div className="mx-auto h-3 w-32 animate-pulse rounded bg-sand" />
          <div className="mx-auto h-10 w-3/4 animate-pulse rounded bg-sand" />
          <div className="mx-auto h-5 w-full animate-pulse rounded bg-parchment" />
        </div>
        <OrnamentDivider className="my-10" />
        <div className="flex flex-wrap justify-center gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
              <ServiceCardSkeleton />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
