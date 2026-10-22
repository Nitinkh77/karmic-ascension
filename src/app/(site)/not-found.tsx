import { Mandala } from "@/components/art/Mandala";
import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container narrow className="py-24 text-center">
      <Mandala className="mx-auto h-28 w-28" />
      <p className="eyebrow mt-8">Page not found</p>
      <h1 className="mt-3 text-4xl text-maroon sm:text-5xl">This path is not on the chart</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
        The page you are looking for does not exist or is no longer published.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/" size="lg">
          Back to home
        </ButtonLink>
        <ButtonLink href="/services" variant="secondary" size="lg">
          View consultations
        </ButtonLink>
      </div>
    </Container>
  );
}
