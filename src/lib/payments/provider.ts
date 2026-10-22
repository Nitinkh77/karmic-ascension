/**
 * Payment provider boundary.
 *
 * TODAY: only the `manual` provider is active — the customer pays by UPI/Paytm
 * using details shown on the confirmation page, and the ADMIN verifies and
 * marks the payment. A booking is never marked paid automatically.
 *
 * LATER (Razorpay): implement `PaymentProvider` for Razorpay and register it in
 * `getPaymentProvider`. The booking system does not need to change:
 *   - createCheckout()  → create a Razorpay order SERVER-side, insert a `payments`
 *                         row (provider='razorpay', status='created'),
 *   - verify()          → verify the checkout signature SERVER-side and only then
 *                         set payments.status='verified' and bookings.payment_status='paid',
 *   - webhook handler   → /api/webhooks/razorpay, verifying X-Razorpay-Signature
 *                         with RAZORPAY_WEBHOOK_SECRET; idempotent thanks to the
 *                         unique indexes on payments(provider, provider_*_id).
 * The browser returning from checkout must NEVER be treated as proof of payment.
 */

export interface PaymentInstructions {
  provider: "manual" | "razorpay";
  /** Shown to the customer on the confirmation page. */
  methods: Array<{ label: string; value: string }>;
  note: string;
  /** Whether this provider can verify payments without a human. */
  automaticVerification: boolean;
}

export interface CheckoutSession {
  provider: "razorpay";
  orderId: string;
  amountPaise: number;
  currency: string;
}

export interface PaymentProvider {
  id: "manual" | "razorpay";
  isConfigured(): boolean;
  describeInstructions(input: {
    paytmPhonepeNumber: string | null;
    gpayUpiId: string | null;
    customInstructions: string | null;
  }): PaymentInstructions;
  /** Not available for manual payments. */
  createCheckout?(input: { bookingId: string; amountPaise: number; currency: string }): Promise<CheckoutSession>;
  /** Not available for manual payments. */
  verify?(input: { orderId: string; paymentId: string; signature: string }): Promise<boolean>;
}

export const manualProvider: PaymentProvider = {
  id: "manual",
  isConfigured: () => true,
  describeInstructions({ paytmPhonepeNumber, gpayUpiId, customInstructions }) {
    const methods: Array<{ label: string; value: string }> = [];
    if (paytmPhonepeNumber) methods.push({ label: "Paytm / PhonePe", value: paytmPhonepeNumber });
    if (gpayUpiId) methods.push({ label: "Google Pay (UPI ID)", value: gpayUpiId });
    return {
      provider: "manual",
      methods,
      note:
        customInstructions?.trim() ||
        "Pay using one of the methods above, quote your booking reference, and send the payment screenshot on WhatsApp. Your booking stays pending until the payment is verified.",
      automaticVerification: false,
    };
  },
};

/** Razorpay is deliberately not implemented yet (see the file header). */
export function getPaymentProvider(): PaymentProvider {
  return manualProvider;
}
