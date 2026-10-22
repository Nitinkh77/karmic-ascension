import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/types";

/** Native <details>/<summary>: keyboard accessible, works without JavaScript. */
export function FaqList({ faqs }: { faqs: Pick<Faq, "id" | "question" | "answer">[] }) {
  if (faqs.length === 0) return null;
  return (
    <div className="mx-auto max-w-3xl divide-y divide-sand rounded-2xl border border-gold-soft bg-white-warm shadow-card">
      {faqs.map((f) => (
        <details key={f.id} className="group px-5 py-1 sm:px-7">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-serif text-xl text-maroon [&::-webkit-details-marker]:hidden">
            {f.question}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-gold-deep transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="whitespace-pre-line pb-5 pr-8 text-ink-soft">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
