"use client";

import { useEffect } from "react";
import { Button, ButtonLink, Container } from "@/components/ui";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container narrow className="py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-4xl text-maroon">We could not load this page</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
        Please try again. If the problem continues, contact us and we will help you directly.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/contact" variant="secondary" size="lg">
          Contact
        </ButtonLink>
      </div>
    </Container>
  );
}
