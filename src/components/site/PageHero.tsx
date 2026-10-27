import type { ReactNode } from "react";
import { Backdrop } from "@/components/site/Backdrop";
import { Container } from "@/components/ui";
import { OrnamentDivider } from "@/components/art/Ornaments";

/** Consistent top-of-page banner: eyebrow, h1, intro and soft morphing backdrop. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden pb-6 pt-12 text-center sm:pt-16">
      <Backdrop />
      <Container narrow>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl text-maroon sm:text-5xl">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
        <OrnamentDivider className="mt-8" />
      </Container>
    </section>
  );
}
