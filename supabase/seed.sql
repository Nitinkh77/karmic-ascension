-- ============================================================================
-- Seed data. Only facts taken from the existing website are used.
-- Anything not on the existing site is left empty or flagged is_draft = true
-- so the owner can review it in Admin. Safe to re-run.
-- ============================================================================

insert into public.site_settings (
  id, brand_name, tagline, description,
  contact_email, contact_phone, whatsapp_number, address, hours_text,
  facebook_url, instagram_url, youtube_url,
  paytm_phonepe_number, gpay_upi_id,
  footer_text
) values (
  1,
  'Karmic Ascension – Vedic Astrology™',
  'Resolve Pending Karma',
  'Book Vedic astrology consultation to know your pending karma for material and spiritual transformation.',
  'karmicascension@neelabhshivam.com',
  '+91-8736066349',
  '918736066349',
  'Prayagraj, Uttar Pradesh, India',
  '7:00 pm – 8:30 pm, by appointment',
  'https://www.facebook.com/108654074765656',
  'https://www.instagram.com/karmic_ascension_vedic_astro',
  'https://www.youtube.com/@karmicascension',
  '8736066349',
  'neelabh.shivam.ns@okicici',
  '© Karmic Ascension - Vedic Astrology™. All Rights Reserved.'
)
on conflict (id) do nothing;

insert into public.pages (slug, title, is_published, is_draft) values
  ('home', 'Home', true, false),
  ('about', 'About Neelabh Shivam', true, false),
  ('services', 'Astrology Consultations', true, false),
  ('contact', 'Contact', true, false),
  ('privacy', 'Privacy Policy', true, true),
  ('terms', 'Terms and Conditions', true, true),
  ('cancellation-refund', 'Cancellation, Refund and Rescheduling', true, true)
on conflict (slug) do nothing;

-- Services named on the existing site. Price is NOT published on the existing
-- site, so price_paise stays NULL ("price on request") until the owner sets it.
-- Duration is a placeholder (is_draft = true) — owner must confirm.
insert into public.services (slug, title, short_description, description, duration_minutes, status, is_featured, is_draft, sort_order) values
  ('vedic-astrology-consultation',
   'Vedic Astrology Consultation',
   'A Vedic astrology consultation to know your pending karma for material and spiritual transformation.',
   'A one-to-one Vedic astrology consultation focused on the pending karma indicated in your birth chart, for material and spiritual transformation.',
   30, 'published', true, true, 10),
  ('pending-karma-reading',
   'Pending Karma Reading',
   'A reading centred on the karma still waiting to be resolved.',
   'A reading that looks at the pending karma shown in your birth chart.',
   30, 'published', true, true, 20),
  ('past-life-reading',
   'Past Life Reading',
   'A reading exploring past-life influences in your chart.',
   'Past Life Reading is mentioned on the existing website. Description, duration and price are to be confirmed by the owner before publishing.',
   30, 'draft', false, true, 30)
on conflict (slug) do nothing;

-- Working hours: the existing site states 7:00 pm – 8:30 pm by appointment but
-- not WHICH DAYS. All days are seeded INACTIVE — enable the days you work in
-- Admin → Availability.
insert into public.availability_rules (weekday, start_time, end_time, is_active)
select d, time '19:00', time '20:30', false from generate_series(0, 6) as d
on conflict (weekday) do nothing;

-- FAQs that restate facts already published on the existing website.
insert into public.faqs (question, answer, sort_order, is_published)
select * from (values
  ('When are consultations held?',
   'Consultations are held by appointment between 7:00 pm and 8:30 pm (IST). Pick an available slot on the booking page.',
   10, true),
  ('How can I pay for a consultation?',
   'After you book, the confirmation page shows the payment details: Paytm / PhonePe on 8736066349 or GPay to neelabh.shivam.ns@okicici. Your booking stays pending until payment is verified.',
   20, true),
  ('Where is Neelabh Shivam based?',
   'Karmic Ascension is based in Prayagraj, Uttar Pradesh, India.',
   30, true)
) as v(question, answer, sort_order, is_published)
where not exists (select 1 from public.faqs);
