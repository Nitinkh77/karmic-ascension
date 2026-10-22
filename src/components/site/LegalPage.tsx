import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Container, RichText } from "@/components/ui";
import { getPageContent, sectionByKey } from "@/lib/data";

/** Shared renderer for the three policy pages (editable in Admin → Website content). */
export async function LegalPage({ slug }: { slug: string }) {
  const page = await getPageContent(slug);
  if (page.notFound) notFound();
  const body = sectionByKey(page.sections, "legal_body");

  return (
    <section className="py-14 sm:py-20">
      <Container narrow>
        <h1 className="text-4xl text-maroon sm:text-5xl">{body?.heading || page.meta.title}</h1>
        {page.meta.isDraft && (
          <p
            role="note"
            className="mt-6 flex items-start gap-3 rounded-xl border border-saffron/40 bg-saffron-soft p-4 text-sm text-charcoal"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-saffron-deep" aria-hidden="true" />
            Draft policy text — pending review by the site owner.
          </p>
        )}
        <RichText text={body?.body} className="mt-8 text-lg" />
      </Container>
    </section>
  );
}
