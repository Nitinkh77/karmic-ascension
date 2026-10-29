import { whatsappLink } from "@/lib/utils";

/**
 * Ready-made WhatsApp messages. They open WhatsApp with the text already written (free,
 * nothing is sent until the admin presses Send). Automatic WhatsApp needs the paid Business API.
 */

/** Indian numbers are often stored without the country code. */
export function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

export type TemplateKey = "confirm" | "payment" | "reminder" | "followup" | "review";

export interface TemplateContext {
  name: string;
  service: string;
  when: string; // already formatted, IST
  code: string;
  reviewUrl?: string | null;
  payment?: string | null;
}

const first = (name: string) => name.trim().split(/\s+/)[0] || name;

export const TEMPLATES: Record<TemplateKey, { label: string; build: (c: TemplateContext) => string }> = {
  confirm: {
    label: "Confirm booking",
    build: (c) =>
      `Namaste ${first(c.name)} 🙏\n\nYour consultation "${c.service}" is confirmed for ${c.when} (IST).\nBooking reference: ${c.code}\n\nPlease keep your birth details ready. We will connect at the scheduled time.\n\n– Karmic Ascension`,
  },
  payment: {
    label: "Payment reminder",
    build: (c) =>
      `Namaste ${first(c.name)} 🙏\n\nA gentle reminder for your consultation "${c.service}" on ${c.when} (IST), reference ${c.code}.\n${c.payment ? `\nPayment details:\n${c.payment}\n` : ""}\nPlease share the payment screenshot or reference once done.\n\n– Karmic Ascension`,
  },
  reminder: {
    label: "Session reminder",
    build: (c) =>
      `Namaste ${first(c.name)} 🙏\n\nThis is a reminder of your consultation "${c.service}" on ${c.when} (IST).\n\nPlease be available a few minutes early with your birth details ready.\n\n– Karmic Ascension`,
  },
  followup: {
    label: "Follow-up check-in",
    build: (c) =>
      `Namaste ${first(c.name)} 🙏\n\nIt has been a while since your "${c.service}" consultation. How are you feeling, and have you been able to follow the remedies suggested?\n\nIf you would like to discuss anything further, just reply here.\n\n– Neelabh Shivam, Karmic Ascension`,
  },
  review: {
    label: "Ask for a Google review",
    build: (c) =>
      `Namaste ${first(c.name)} 🙏\n\nThank you for your consultation. If it was helpful, we would be grateful if you could share a few words about your experience on Google. It helps others find the right guidance.\n\n${c.reviewUrl ?? ""}\n\nWith gratitude,\nNeelabh Shivam, Karmic Ascension`,
  },
};

export function templateLink(phone: string, key: TemplateKey, ctx: TemplateContext): string | null {
  return whatsappLink(waNumber(phone), TEMPLATES[key].build(ctx));
}
