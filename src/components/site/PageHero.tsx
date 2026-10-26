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
    <section className="night relative isolate overflow-hidden pb-14 pt-14 text-center sm:pb-16 sm:pt-20">
      <Backdrop />
      <Container narrow>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="foil pb-1 text-4xl sm:text-6xl">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-2xl text-lg text-ivory/80">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
        <OrnamentDivider className="mt-8 text-leaf" />
      </Container>
    </section>
  );
}
