-- Real client feedback taken from Neelabh Shivam's public AstroSage profile (checked 25 Oct 2026).
-- Reviewer IDs are masked on AstroSage, so the author is shown as "AstroSage client".
-- Run once in Supabase → SQL Editor.

insert into public.testimonials (author_name, author_detail, quote, rating, source, is_verified, is_published, sort_order)
select * from (values
  ('AstroSage client', 'April 2026',
   'I had a wonderful experience consulting this astrologer. The predictions were surprisingly accurate and explained very clearly.',
   5, 'Public review on the AstroSage profile', true, true, 10),
  ('AstroSage client', 'March 2026',
   'Thank you sir for your guidance 🙏🏻',
   5, 'Public review on the AstroSage profile', true, true, 20)
) as v(author_name, author_detail, quote, rating, source, is_verified, is_published, sort_order)
where not exists (select 1 from public.testimonials t where t.quote = v.quote);

-- AstroSage profile link (shown on the Reviews page).
update public.site_settings
set astrosage_url = 'https://varta.astrosage.com/astrologer/neelabhastro3454'
where id = 1;

-- OPTIONAL: social links from neelabhshivam.com (they appear as icons in the footer). Remove the leading "--" to run.
-- update public.site_settings set
--   instagram_url = 'https://www.instagram.com/karmic_ascension_vedic_astro/',
--   facebook_url  = 'https://www.facebook.com/108654074765656',
--   youtube_url   = 'https://www.youtube.com/@karmicascension'
-- where id = 1;
