import { z } from "zod";

const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
// Absent (undefined) and blank optional fields both mean "not provided".
const emptyToNull = (v: unknown) =>
  v === undefined || (typeof v === "string" && v.trim() === "") ? null : v;

/** optional trimmed text → string | null */
const optText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable());

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use a time like 19:00.");

/* ---------------------------------------------------------------- public: booking */

export const bookingSchema = z.object({
  service_id: uuid.or(z.literal("")).refine((v) => v !== "", "Please choose a consultation."),
  starts_at: z
    .string()
    .refine((v) => v !== "" && !Number.isNaN(Date.parse(v)), "Please choose a date and time."),
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9()\-\s]{7,20}$/, "Please enter a valid phone number (7–20 digits)."),
  birth_date: z.preprocess(emptyToUndef, isoDate.optional()),
  birth_time: z.preprocess(emptyToUndef, hhmm.optional()),
  birth_place: z.preprocess(emptyToUndef, z.string().trim().max(200).optional()),
  notes: z.preprocess(emptyToUndef, z.string().trim().max(1000).optional()),
  accept_terms: z.literal(true, { error: "Please accept the terms and policies to continue." }),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(0).optional(),
});

export const slotQuerySchema = z.object({
  service: z.string().trim().min(1).max(120),
  date: isoDate,
});

/* ---------------------------------------------------------------- admin: auth */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().max(300).optional(),
});

/* -------------------------------------------------------------- admin: settings */

const url = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .max(300)
    .refine((v) => /^https?:\/\//i.test(v), "Must start with http:// or https://")
    .nullable(),
);

export const settingsSchema = z.object({
  brand_name: z.string().trim().min(2, "Brand name is required.").max(120),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(400),
  contact_email: z.preprocess(emptyToNull, z.string().trim().email("Enter a valid email.").max(200).nullable()),
  contact_phone: optText(30),
  whatsapp_number: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length >= 8 && v.length <= 15, "Enter digits with country code, e.g. 918736066349.")
      .nullable(),
  ),
  address: optText(300),
  hours_text: optText(200),
  facebook_url: url,
  instagram_url: url,
  youtube_url: url,
  astrosage_url: url,
  paytm_phonepe_number: optText(30),
  gpay_upi_id: optText(100),
  payment_instructions: optText(1000),
  slot_minutes: z.coerce.number().int().min(5).max(240),
  buffer_minutes: z.coerce.number().int().min(0).max(120),
  min_notice_hours: z.coerce.number().int().min(0).max(720),
  max_advance_days: z.coerce.number().int().min(1).max(365),
  booking_policy_text: optText(2000),
  announcement_text: optText(300),
  announcement_href: optText(300),
  announcement_active: z.boolean(),
  footer_text: optText(300),
  seo_title: optText(120),
  seo_description: optText(300),
});

/* ---------------------------------------------------------------- admin: content */

export const pageMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1, "Title is required.").max(160),
  meta_title: optText(120),
  meta_description: optText(300),
  is_published: z.boolean(),
  is_draft: z.boolean(),
});

export const sectionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  section_key: z.string().regex(/^[a-z0-9_]+$/),
  eyebrow: optText(120),
  heading: optText(300),
  body: optText(8000),
  items_text: z.string().max(4000),
  cta_label: optText(80),
  cta_href: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .max(300)
      .refine(
        (v) => (v.startsWith("/") && !v.startsWith("//")) || /^(https?:\/\/|mailto:|tel:)/i.test(v),
        "Use a path like /book or a full https:// link.",
      )
      .nullable(),
  ),
  image_asset_id: z.preprocess(emptyToNull, uuid.nullable()),
  sort_order: z.coerce.number().int().min(0).max(10000),
  is_visible: z.boolean(),
  is_draft: z.boolean(),
});

/* --------------------------------------------------------------- admin: services */

export const serviceSchema = z.object({
  id: z.preprocess(emptyToUndef, uuid.optional()),
  title: z.string().trim().min(2, "Title is required.").max(160),
  slug: z.preprocess(
    emptyToUndef,
    z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.")
      .max(80)
      .optional(),
  ),
  short_description: z.string().trim().max(300),
  description: z.string().trim().max(8000),
  price_rupees: z.string().trim().max(20),
  duration_minutes: z.coerce.number().int().min(10, "Minimum 10 minutes.").max(480, "Maximum 480 minutes."),
  features_text: z.string().max(4000),
  deliverables_text: z.string().max(4000),
  image_asset_id: z.preprocess(emptyToNull, uuid.nullable()),
  status: z.enum(["draft", "published", "archived"]),
  sort_order: z.coerce.number().int().min(0).max(10000),
  is_featured: z.boolean(),
  requires_birth_details: z.boolean(),
  is_draft: z.boolean(),
});

/* ------------------------------------------------------ admin: FAQs/testimonials */

export const faqSchema = z.object({
  id: z.preprocess(emptyToUndef, uuid.optional()),
  question: z.string().trim().min(3, "Enter the question.").max(300),
  answer: z.string().trim().min(1, "Enter the answer.").max(4000),
  service_id: z.preprocess(emptyToNull, uuid.nullable()),
  sort_order: z.coerce.number().int().min(0).max(10000),
  is_published: z.boolean(),
});

export const testimonialSchema = z
  .object({
    id: z.preprocess(emptyToUndef, uuid.optional()),
    author_name: z.string().trim().min(1, "Enter the client's name.").max(120),
    author_detail: optText(160),
    quote: z.string().trim().min(3, "Enter the testimonial text.").max(2000),
    rating: z.preprocess(emptyToNull, z.coerce.number().int().min(1).max(5).nullable()),
    source: optText(200),
    sort_order: z.coerce.number().int().min(0).max(10000),
    is_verified: z.boolean(),
    is_published: z.boolean(),
  })
  .refine((v) => !v.is_published || v.is_verified, {
    path: ["is_published"],
    message: "A testimonial can only be published after you tick “Verified”.",
  });

/* ------------------------------------------------------- admin: availability */

export const weeklyHoursSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    start_time: hhmm,
    end_time: hhmm,
    is_active: z.boolean(),
  })
  .refine((v) => v.end_time > v.start_time, {
    path: ["end_time"],
    message: "End time must be after start time.",
  });

export const blockedDateSchema = z
  .object({
    blocked_on: isoDate,
    start_time: z.preprocess(emptyToNull, hhmm.nullable()),
    end_time: z.preprocess(emptyToNull, hhmm.nullable()),
    reason: optText(200),
  })
  .refine((v) => (v.start_time === null) === (v.end_time === null), {
    path: ["end_time"],
    message: "Enter both a start and an end time, or leave both empty to block the whole day.",
  })
  .refine((v) => v.start_time === null || v.end_time === null || v.end_time > v.start_time, {
    path: ["end_time"],
    message: "End time must be after start time.",
  });

/* ----------------------------------------------------------------- admin: media */

export const mediaMetaSchema = z.object({
  id: uuid,
  alt_text: z.string().trim().max(300),
  folder: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens."),
});

/* -------------------------------------------------------------- admin: bookings */

export const bookingStatusSchema = z.object({
  id: uuid,
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export const bookingPaymentSchema = z.object({
  id: uuid,
  payment_status: z.enum(["unpaid", "pending_verification", "paid", "refunded", "waived"]),
  reference: optText(200),
});

export const bookingNotesSchema = z.object({
  id: uuid,
  admin_notes: optText(4000),
});

export const bookingRescheduleSchema = z.object({
  id: uuid,
  date: isoDate,
  time: hhmm,
});

/* ------------------------------------------------------------------ leads */

export const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"] as const;

/** Public enquiry form. At least one of email / phone is required, and consent is mandatory. */
export const leadSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email: z.preprocess(
      emptyToUndef,
      z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200).optional(),
    ),
    phone: z.preprocess(
      emptyToUndef,
      z
        .string()
        .trim()
        .regex(/^\+?[0-9()\-\s]{7,20}$/, "Please enter a valid phone number (7–20 digits).")
        .optional(),
    ),
    message: z.preprocess(emptyToUndef, z.string().trim().max(1000, "Please keep your message under 1000 characters.").optional()),
    service_id: z.preprocess(emptyToUndef, uuid.optional()),
    source: z.preprocess(
      emptyToUndef,
      z
        .string()
        .trim()
        .max(60)
        .regex(/^[a-z0-9:_-]+$/i)
        .optional(),
    ),
    consent: z.literal(true, { error: "Please tick the box so we may contact you about your enquiry." }),
    website: z.string().max(0).optional(), // honeypot
  })
  .refine((v) => Boolean(v.email || v.phone), { path: ["phone"], message: "Please give a phone number or an email address." });

export const leadStatusSchema = z.object({ id: uuid, status: z.enum(LEAD_STATUSES) });
export const leadNotesSchema = z.object({ id: uuid, admin_notes: optText(4000) });
