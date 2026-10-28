-- ============================================================================
-- Google Reviews import – real client reviews from Google Business Profile
-- Run in Supabase → SQL Editor after existing migrations.
-- Safe to re-run: skips rows whose quote already exists.
-- ============================================================================

insert into public.testimonials (author_name, author_detail, quote, rating, source, is_verified, is_published, sort_order)
select * from (values
  ('Shweta Panwar', '4 reviews · 1 photo',
   'The insights shared by Neelabh Shivam ji at Karmic Ascension were surprisingly accurate and deeply resonated with my life experiences. The connection between past life patterns and my current yogs and doshas was explained beautifully and clarified many challenges. Truly a profound Vedic astrology experience. 🙏',
   5, 'Google Review', true, true, 10),

  ('Deepesh Garg', '2 reviews',
   'I recently had a astro reading done from Neelabh bhai and honestly, it felt so accurate that I was left amazed. The way he explained the doshas connected to my past life made so much sense and matched with what I''ve been experiencing.',
   5, 'Google Review', true, true, 20),

  ('Pravesh Kumar', '3 reviews',
   'I am deeply grateful to Neelabh bhaiya for the divine guidance he gave in the session. Neelabh bhaiya beautifully connected astrology with past life karma helping me understand my life''s challenges as part of a higher plan and helping me.',
   5, 'Google Review', true, true, 30),

  ('Akshit Balana', 'Local Guide · 13 reviews · 6 photos',
   'I had an amazing experience with Neelab Shivam Sir. The way he explained my past life readings was truly extraordinary. The insights he shared about my Kundli and planetary positions are things that no one has ever told me before. His depth of knowledge is remarkable.',
   5, 'Google Review', true, true, 40),

  ('Anand Mohan', '5 reviews',
   'Had a wonderful session. The in depth knowledge of Neelabh sir is amazing and onto the mark. The accuracy of his predictions is highly commendable. The remedies and safeguards suggested by him have been really helpful. Truly blessed to have a mentor like him.',
   5, 'Google Review', true, true, 50),

  ('M Maan', '3 reviews',
   'I had a great session with Neelabh Shivam bhaiya. All insights and revelations about past lives and the planetary positions are very helpful. I''m feeling very light and uplifted after discussing various aspects of my soul journey with him.',
   5, 'Google Review', true, true, 60),

  ('Gayatri V.', '6 reviews',
   'I had a wonderful session with Neelabh sir. It was truly an enlightening experience. He has a profound knowledge of astrology. He is really good with decoding the past life karma and giving simple solutions to balance the karmic cycle. Would highly recommend!',
   5, 'Google Review', true, true, 70)
) as v(author_name, author_detail, quote, rating, source, is_verified, is_published, sort_order)
where not exists (select 1 from public.testimonials t where t.author_name = v.author_name and t.source = 'Google Review');
