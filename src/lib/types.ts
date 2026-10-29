export interface SiteSettings {
  brand_name: string;
  tagline: string;
  description: string;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  hours_text: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  astrosage_url: string | null;
  paytm_phonepe_number: string | null;
  gpay_upi_id: string | null;
  payment_instructions: string | null;
  razorpay_link: string | null;
  timezone: string;
  slot_minutes: number;
  buffer_minutes: number;
  min_notice_hours: number;
  max_advance_days: number;
  booking_policy_text: string | null;
  announcement_text: string | null;
  announcement_href: string | null;
  announcement_active: boolean;
  footer_text: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_asset_id: string | null;
  google_review_url?: string | null;
  notify_email?: string | null;
  google_business_url?: string | null;
}

export interface SectionItem {
  title: string;
  text: string;
}

export interface Section {
  key: string;
  eyebrow: string | null;
  heading: string | null;
  body: string | null;
  items: SectionItem[];
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageAssetId: string | null;
  sortOrder: number;
  isVisible: boolean;
  isDraft: boolean;
  /** true when the value comes from built-in defaults rather than the database */
  isDefault: boolean;
}

export interface PageMeta {
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  isDraft: boolean;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  price_paise: number | null;
  currency: string;
  duration_minutes: number;
  features: string[];
  deliverables: string[];
  image_asset_id: string | null;
  imageUrl: string | null;
  imageAlt: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  requires_birth_details: boolean;
  is_draft: boolean;
  sort_order: number;
  /** true when served from built-in defaults (database not configured) */
  isDefault?: boolean;
}

export interface Faq {
  id: string;
  service_id: string | null;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_detail: string | null;
  quote: string;
  rating: number | null;
  source: string | null;
  is_verified: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface AvailabilityRule {
  id?: string;
  weekday: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  is_active: boolean;
}

export interface UnavailableRange {
  kind: "booking" | "blocked";
  starts_at: string;
  ends_at: string;
}

export interface MediaAsset {
  id: string;
  storage_path: string;
  folder: string;
  alt_text: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  url: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "unpaid" | "pending_verification" | "paid" | "refunded" | "waived";

export interface Booking {
  id: string;
  public_code: string;
  service_id: string | null;
  service_title: string;
  service_price_paise: number | null;
  currency: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  customer_notes: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: "manual" | "razorpay";
  admin_notes: string | null;
  created_at: string;
  // Private case record (admin only). Present only on the booking detail query.
  case_lagna?: string | null;
  case_rashi?: string | null;
  case_dasha?: string | null;
  case_observations?: string | null;
  case_pending_karma?: string | null;
  remedy_gemstones?: string | null;
  remedy_mantras?: string | null;
  remedy_fasts?: string | null;
  remedy_donations?: string | null;
  follow_up_on?: string | null;
  follow_up_done?: boolean;
  review_requested_at?: string | null;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  service_id: string | null;
  source: string;
  status: LeadStatus;
  consent: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Submitted text values, returned on failure so forms can repopulate after React resets them. */
  values?: Record<string, string>;
} | null;
