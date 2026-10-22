import type { Metadata } from "next";
import { CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { ButtonLink, Container } from "@/components/ui";
import { getBookingMode } from "@/lib/booking/config";
import { getSettings } from "@/lib/data";
import { formatDateTimeIst } from "@/lib/booking/slots";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatPrice, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Booking received",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^KA-[A-Z0-9]{8}$/;

/**
 * Shows ONE booking, only when BOTH the public code and the secret access token
 * match (the token is a random UUID given only to the person who booked).
 * Only a minimal, non-sensitive subset is selected and displayed.
 */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; token?: string }>;
}) {
  const { code = "", token = "" } = await searchParams;
  let booking: {
    public_code: string;
    service_title: string;
    service_price_paise: number | null;
    currency: string;
    starts_at: string;
    status: string;
    payment_status: string;
    customer_name: string;
  } | null = null;

  if (getBookingMode().enabled && CODE.test(code) && UUID.test(token)) {
    const { data } = await createServiceClient()
      .from("bookings")
      .select("public_code, service_title, service_price_paise, currency, starts_at, status, payment_status, customer_name")
      .eq("public_code", code)
      .eq("access_token", token)
      .maybeSingle();
    booking = data;
  }

  if (!booking) {
    return (
      <Container narrow className="py-20 text-center">
        <h1 className="text-4xl text-maroon">Booking not found</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          This link is invalid or incomplete. Please use the link shown right after you booked, or contact us with your
          booking reference.
        </p>
        <ButtonLink href="/contact" size="lg" className="mt-8">
          Contact us
        </ButtonLink>
      </Container>
    );
  }

  const settings = await getSettings();
  const instructions = getPaymentProvider().describeInstructions({
    paytmPhonepeNumber: settings.paytm_phonepe_number,
    gpayUpiId: settings.gpay_upi_id,
    customInstructions: settings.payment_instructions,
  });
  const price = formatPrice(booking.service_price_paise, booking.currency);
  const wa = whatsappLink(
    settings.whatsapp_number,
    `Namaste, my booking reference is ${booking.public_code}. I am sending my payment details.`,
  );
  const paid = booking.payment_status === "paid" || booking.payment_status === "waived";

  return (
    <section className="py-14 sm:py-20">
      <Container narrow>
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden="true" />
          <h1 className="mt-4 text-4xl text-maroon sm:text-5xl">Booking request received</h1>
          <p className="mx-auto mt-3 max-w-lg text-lg text-ink-soft">
            Thank you, {booking.customer_name.split(" ")[0]}. Your time is held while we verify payment.
          </p>
        </div>

        <div className="ornate-frame mt-10 rounded-2xl p-7">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="eyebrow">Reference</dt><dd className="font-mono text-lg font-semibold">{booking.public_code}</dd></div>
            <div><dt className="eyebrow">Consultation</dt><dd>{booking.service_title}</dd></div>
            <div><dt className="eyebrow">When (IST)</dt><dd>{formatDateTimeIst(booking.starts_at)}</dd></div>
            <div><dt className="eyebrow">Price</dt><dd>{price ?? "To be confirmed with you"}</dd></div>
            <div><dt className="eyebrow">Booking status</dt><dd className="capitalize">{booking.status}</dd></div>
            <div><dt className="eyebrow">Payment status</dt><dd className="capitalize">{booking.payment_status.replace("_", " ")}</dd></div>
          </dl>
        </div>

        {!paid && booking.status !== "cancelled" && (
          <div className="mt-8 rounded-2xl border border-saffron/40 bg-saffron-soft p-7">
            <h2 className="flex items-center gap-2 text-2xl text-maroon">
              <Clock className="h-5 w-5" aria-hidden="true" /> How to pay
            </h2>
            {instructions.methods.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {instructions.methods.map((m) => (
                  <li key={m.label} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-white-warm px-4 py-3">
                    <span className="font-semibold text-charcoal">{m.label}</span>
                    <span className="select-all font-mono text-charcoal">{m.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-charcoal">Payment details will be shared with you directly.</p>
            )}
            <p className="mt-4 text-charcoal">{instructions.note}</p>
            <p className="mt-2 text-sm text-ink-soft">
              Your booking is only marked paid after the owner checks the payment. Returning to this page does not
              change its status.
            </p>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-maroon px-7 font-semibold text-ivory hover:bg-maroon-deep">
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> Send payment proof on WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-ink-soft">
          Please keep your reference. No confirmation e-mail is sent automatically yet — you will hear from us on the
          phone number or e-mail you provided.
        </p>
        <div className="mt-6 text-center">
          <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
