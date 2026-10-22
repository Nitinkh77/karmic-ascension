import type { SiteSettings, SectionItem, Service } from "@/lib/types";

/**
 * Built-in content. It is used (a) when Supabase is not configured yet, and
 * (b) to fill any section the owner has not edited in the database.
 *
 * SOURCE OF TRUTH: facts (brand, tagline, contact details, hours, payment
 * methods, social links, Sanskrit prayers, service names) come from the
 * existing website neelabhshivam.com. Nothing else is invented: no prices,
 * credentials, testimonials, years of experience or guarantees.
 * Copy marked `draft: true` is generic wording the owner should review.
 */

export const DEFAULT_SETTINGS: SiteSettings = {
  brand_name: "Karmic Ascension – Vedic Astrology™",
  tagline: "Resolve Pending Karma",
  description:
    "Book Vedic astrology consultation to know your pending karma for material and spiritual transformation.",
  contact_email: "karmicascension@neelabhshivam.com",
  contact_phone: "+91-8736066349",
  whatsapp_number: "918736066349",
  address: "Prayagraj, Uttar Pradesh, India",
  hours_text: "7:00 pm – 8:30 pm, by appointment",
  facebook_url: "https://www.facebook.com/108654074765656",
  instagram_url: "https://www.instagram.com/karmic_ascension_vedic_astro",
  youtube_url: "https://www.youtube.com/@karmicascension",
  astrosage_url: null,
  paytm_phonepe_number: "8736066349",
  gpay_upi_id: "neelabh.shivam.ns@okicici",
  payment_instructions: null,
  razorpay_link: null,
  timezone: "Asia/Kolkata",
  slot_minutes: 30,
  buffer_minutes: 10,
  min_notice_hours: 12,
  max_advance_days: 30,
  booking_policy_text: null,
  announcement_text: null,
  announcement_href: null,
  announcement_active: false,
  footer_text: "© Karmic Ascension - Vedic Astrology™. All Rights Reserved.",
  seo_title: null,
  seo_description: null,
  og_image_asset_id: null,
};

export const GANESH_INVOCATION = "॥ श्री गणेशाय नमः ॥";

export const NAVAGRAHA_SHLOKA =
  "ऊँ ब्रह्मा मुरारी त्रिपुरांतकारी भानु: शशि भूमि सुतो बुधश्च।\nगुरुश्च शुक्र शनि राहु केतव सर्वे ग्रहा शांति करा भवंतु।।";

export interface DefaultSection {
  key: string;
  sortOrder: number;
  eyebrow?: string;
  heading?: string;
  body?: string;
  items?: SectionItem[];
  ctaLabel?: string;
  ctaHref?: string;
  isVisible?: boolean;
  /** generic wording that the owner should review */
  draft?: boolean;
  /** short label shown in the admin editor */
  label: string;
}

export interface DefaultPage {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription: string;
  draft?: boolean;
  sections: DefaultSection[];
}

const LEGAL_NOTICE =
  "This text is a draft prepared for owner review. Please have it reviewed before relying on it.";

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    slug: "home",
    title: "Home",
    metaTitle: "Karmic Ascension – Vedic Astrology™ | Resolve Pending Karma",
    metaDescription: DEFAULT_SETTINGS.description,
    sections: [
      {
        key: "hero",
        label: "Hero",
        sortOrder: 10,
        eyebrow: "Vedic Astrology · Prayagraj",
        heading: "Resolve Pending Karma",
        body: DEFAULT_SETTINGS.description,
        ctaLabel: "Book a consultation",
        ctaHref: "/book",
      },
      {
        key: "intro",
        label: "Brand introduction",
        sortOrder: 20,
        draft: true,
        eyebrow: "Karmic Ascension",
        heading: "A Vedic reading of the karma still asking to be resolved",
        body: "In Vedic astrology the birth chart is read as a map of the karma carried into this life. Karmic Ascension offers consultations that look at the pending karma indicated in your chart, for material and spiritual transformation.",
      },
      {
        key: "services",
        label: "Featured consultations (heading)",
        sortOrder: 30,
        eyebrow: "Consultations",
        heading: "Choose your consultation",
        body: "Select a consultation to see its details and book an appointment.",
        ctaLabel: "View all consultations",
        ctaHref: "/services",
      },
      {
        key: "prayer",
        label: "Navagraha prayer (verse from the existing site; transliteration and meaning added — please verify)",
        sortOrder: 40,
        draft: true,
        eyebrow: "Navagraha Prayer",
        heading: "A prayer for planetary peace",
        body: NAVAGRAHA_SHLOKA,
        items: [
          {
            title: "Transliteration",
            text: "Om Brahmā Murāri Tripurāntakārī Bhānuḥ Śaśī Bhūmi-suto Budhaśca | Guruśca Śukra Śani Rāhu Ketavaḥ sarve grahāḥ śāntikarā bhavantu ||",
          },
          {
            title: "Meaning",
            text: "May Brahmā, Murāri (Viṣṇu), Tripurāntakārī (Śiva), the Sun, the Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rāhu and Ketu — all the planets — become bringers of peace.",
          },
        ],
      },
      {
        key: "why",
        label: "Why choose this approach",
        sortOrder: 50,
        draft: true,
        eyebrow: "The approach",
        heading: "Why choose this approach",
        items: [
          {
            title: "Centred on karma",
            text: "Consultations focus on the pending karma indicated in your birth chart.",
          },
          {
            title: "Material and spiritual",
            text: "The reading looks at worldly matters and spiritual growth together.",
          },
          {
            title: "By appointment",
            text: "Sessions are scheduled individually, with time set aside for you.",
          },
        ],
      },
      {
        key: "process",
        label: "Consultation process",
        sortOrder: 60,
        draft: true,
        eyebrow: "How it works",
        heading: "How a consultation works",
        items: [
          { title: "Choose a consultation", text: "Pick the consultation that suits you." },
          {
            title: "Select a date and time",
            text: "Choose an open slot. Appointments are held between 7:00 pm and 8:30 pm (IST).",
          },
          {
            title: "Share your details",
            text: "Enter your contact details and, where required, your birth details.",
          },
          {
            title: "Complete payment",
            text: "Payment details are shown after you book. Your booking is confirmed once payment is verified.",
          },
        ],
      },
      {
        key: "about",
        label: "About the astrologer (teaser)",
        sortOrder: 70,
        eyebrow: "The astrologer",
        heading: "Neelabh Shivam",
        body: "Neelabh Shivam is the Vedic astrologer behind Karmic Ascension, based in Prayagraj, Uttar Pradesh, India.",
        ctaLabel: "About Neelabh Shivam",
        ctaHref: "/about",
      },
      {
        key: "testimonials",
        label: "Testimonials (heading) — shown only when verified testimonials exist",
        sortOrder: 80,
        eyebrow: "Client words",
        heading: "What clients say",
      },
      {
        key: "faqs",
        label: "FAQs (heading)",
        sortOrder: 90,
        eyebrow: "Questions",
        heading: "Frequently asked questions",
      },
      {
        key: "cta",
        label: "Contact & booking call to action",
        sortOrder: 100,
        heading: "Begin your consultation",
        body: "Book a time that suits you, or reach out on WhatsApp if you have a question first.",
        ctaLabel: "Book a consultation",
        ctaHref: "/book",
      },
    ],
  },
  {
    slug: "about",
    title: "About Neelabh Shivam",
    metaDescription:
      "About Neelabh Shivam, Vedic astrologer behind Karmic Ascension in Prayagraj, Uttar Pradesh, India.",
    sections: [
      {
        key: "about_intro",
        label: "Introduction",
        sortOrder: 10,
        draft: true,
        eyebrow: "The astrologer",
        heading: "About Neelabh Shivam",
        body: "Neelabh Shivam is the Vedic astrologer behind Karmic Ascension – Vedic Astrology™, based in Prayagraj, Uttar Pradesh, India.\n\nKarmic Ascension offers Vedic astrology consultations to understand pending karma for material and spiritual transformation.",
      },
      {
        key: "about_story",
        label: "Biography (owner to write — hidden until you add text and make it visible)",
        sortOrder: 20,
        draft: true,
        isVisible: false,
        heading: "My journey",
        body: "",
      },
    ],
  },
  {
    slug: "services",
    title: "Astrology Consultations",
    metaDescription:
      "Vedic astrology consultations to know your pending karma for material and spiritual transformation.",
    sections: [
      {
        key: "services_intro",
        label: "Page introduction",
        sortOrder: 10,
        eyebrow: "Consultations",
        heading: "Astrology consultations",
        body: "Book a Vedic astrology consultation to know your pending karma for material and spiritual transformation.",
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    metaDescription: "Contact Karmic Ascension – Vedic Astrology™ in Prayagraj, Uttar Pradesh, India.",
    sections: [
      {
        key: "contact_intro",
        label: "Page introduction",
        sortOrder: 10,
        eyebrow: "Get in touch",
        heading: "Contact",
        body: "Write or message with any question before you book. Consultations are held by appointment.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    metaDescription: "How Karmic Ascension – Vedic Astrology™ handles your personal information.",
    draft: true,
    sections: [
      {
        key: "legal_body",
        label: "Policy text",
        sortOrder: 10,
        draft: true,
        heading: "Privacy Policy",
        body: `${LEGAL_NOTICE}\n\n## Information we collect\nWhen you book a consultation we collect your name, email address and phone number. For consultations that need a birth chart we also collect your date, time and place of birth, and any notes you choose to add.\n\n## How we use it\nYour information is used to schedule and deliver your consultation, to contact you about your booking and to verify your payment. We do not sell your personal information.\n\n## Storage and security\nBooking information is stored in a secured database that only the site owner can access. We do not store card details on this website.\n\n## Cookies\nThe website may use cookies for basic operation and traffic analysis.\n\n## Your choices\nYou can ask us to correct or delete your booking information by contacting us using the details on the Contact page.`,
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms and Conditions",
    metaDescription: "Terms and conditions for using Karmic Ascension – Vedic Astrology™.",
    draft: true,
    sections: [
      {
        key: "legal_body",
        label: "Terms text",
        sortOrder: 10,
        draft: true,
        heading: "Terms and Conditions",
        body: `${LEGAL_NOTICE}\n\n## Nature of the service\nAstrology consultations are offered for guidance and spiritual reflection. They are not a substitute for professional medical, legal, financial or psychological advice, and no particular outcome is guaranteed.\n\n## Bookings\nA booking request reserves a time slot and remains pending until the owner confirms it. Appointments are held by appointment between the hours shown on the booking page (IST).\n\n## Payment\nPayment is made using the methods shown after booking. A booking is confirmed only after payment has been verified by the owner.\n\n## Your information\nYou agree to provide accurate details. Birth details are used to prepare your chart.\n\n## Changes\nThese terms may be updated from time to time.`,
      },
    ],
  },
  {
    slug: "cancellation-refund",
    title: "Cancellation, Refund and Rescheduling",
    metaDescription: "Cancellation, refund and rescheduling policy for Karmic Ascension consultations.",
    draft: true,
    sections: [
      {
        key: "legal_body",
        label: "Policy text",
        sortOrder: 10,
        draft: true,
        heading: "Cancellation, Refund and Rescheduling",
        body: `${LEGAL_NOTICE}\n\n## Rescheduling\nTo reschedule a consultation, contact us on WhatsApp, phone or email as early as possible, quoting your booking reference. Rescheduling depends on availability.\n\n## Cancellation\nTo cancel, contact us quoting your booking reference. The owner can cancel a booking from the admin dashboard.\n\n## Refunds\n[Owner to confirm: refund conditions, timeframes and processing method. The existing website publishes its cancellation and refund policy on a Razorpay-hosted page; copy those terms here once confirmed.]`,
      },
    ],
  },
];

export function getDefaultPage(slug: string): DefaultPage | undefined {
  return DEFAULT_PAGES.find((p) => p.slug === slug);
}

/**
 * Services named on the existing website. The existing site shows NO prices,
 * so price is left empty ("price on request"). Duration is a placeholder.
 * Only shown when Supabase is not configured; booking is disabled in that mode.
 */
export const DEFAULT_SERVICES: Service[] = [
  {
    id: "default-vedic-astrology-consultation",
    slug: "vedic-astrology-consultation",
    title: "Vedic Astrology Consultation",
    short_description:
      "A Vedic astrology consultation to know your pending karma for material and spiritual transformation.",
    description:
      "A one-to-one Vedic astrology consultation focused on the pending karma indicated in your birth chart, for material and spiritual transformation.",
    price_paise: null,
    currency: "INR",
    duration_minutes: 30,
    features: [],
    deliverables: [],
    image_asset_id: null,
    imageUrl: null,
    imageAlt: "",
    status: "published",
    is_featured: true,
    requires_birth_details: true,
    is_draft: true,
    sort_order: 10,
    isDefault: true,
  },
  {
    id: "default-pending-karma-reading",
    slug: "pending-karma-reading",
    title: "Pending Karma Reading",
    short_description: "A reading centred on the karma still waiting to be resolved.",
    description: "A reading that looks at the pending karma shown in your birth chart.",
    price_paise: null,
    currency: "INR",
    duration_minutes: 30,
    features: [],
    deliverables: [],
    image_asset_id: null,
    imageUrl: null,
    imageAlt: "",
    status: "published",
    is_featured: true,
    requires_birth_details: true,
    is_draft: true,
    sort_order: 20,
    isDefault: true,
  },
];
