"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CheckCircle2, MessageCircle, Star } from "lucide-react";
import { markReviewRequested } from "@/app/admin/(panel)/actions";
import { TEMPLATES, templateLink, type TemplateContext, type TemplateKey } from "@/lib/whatsapp-templates";

const ORDER: TemplateKey[] = ["confirm", "payment", "reminder", "followup"];

/**
 * One-click WhatsApp messages. Each button opens WhatsApp with the message already written;
 * nothing is sent until the admin presses Send there. The review request is also recorded.
 */
export function WhatsAppActions({
  bookingId,
  phone,
  ctx,
  completed,
  reviewRequestedAt,
}: {
  bookingId: string;
  phone: string;
  ctx: TemplateContext;
  completed: boolean;
  reviewRequestedAt: string | null;
}) {
  const [pending, start] = useTransition();
  const reviewLink = ctx.reviewUrl ? templateLink(phone, "review", ctx) : null;
  const btn =
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-gold bg-white-warm px-4 text-sm font-semibold text-maroon hover:bg-parchment";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ORDER.map((k) => {
          const href = templateLink(phone, k, ctx);
          return href ? (
            <a key={k} href={href} target="_blank" rel="noopener noreferrer" className={btn}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> {TEMPLATES[k].label}
              <span className="sr-only"> (opens WhatsApp in a new tab)</span>
            </a>
          ) : null;
        })}
      </div>

      <div className={`rounded-xl border p-3 ${completed ? "border-saffron/50 bg-saffron-soft" : "border-sand bg-parchment/50"}`}>
        <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <Star className="h-4 w-4 text-saffron-deep" aria-hidden="true" /> Google review request
        </p>
        {reviewLink ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href={reviewLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => start(() => void markReviewRequested(bookingId))}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-maroon px-5 text-sm font-semibold text-ivory hover:bg-maroon-deep"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> {reviewRequestedAt ? "Send again" : "Send review request"}
              <span className="sr-only"> (opens WhatsApp in a new tab)</span>
            </a>
            {reviewRequestedAt && (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Requested {new Date(reviewRequestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
              </span>
            )}
            {pending && <span className="text-xs text-ink-soft">Saving…</span>}
          </div>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">
            Add your Google review link in <Link href="/admin/settings" className="font-semibold text-maroon underline">Settings</Link> to enable this button.
          </p>
        )}
        {!completed && reviewLink && <p className="mt-2 text-xs text-ink-soft">Best sent after the session is marked Completed.</p>}
      </div>
    </div>
  );
}
