-- Real Google reviews of Karmic Ascension - Vedic Astrology (text copied from the public Google listing, 28 Oct 2026).
-- Reviews that Google shows cut off ("... More") are kept as the visible excerpt and end with "…".
-- Safe to run more than once. Run in Supabase -> SQL Editor.

insert into public.testimonials (author_name, author_detail, quote, rating, source, is_verified, is_published, sort_order)
select * from (values
  ('shweta panwar', null,
   'The insights shared by Neelabh Shivam ji at Karmic Ascension were surprisingly accurate and deeply resonated with my life experiences. The connection between past life patterns and my current yogs and doshas was explained beautifully and clarified many challenges. Truly a profound Vedic astrology experience. 🙏',
   5, 'Google review', true, true, 1),
  ('Jatinder Gill', null,
   'Absolutely transformative experience! Neelabh Shivam provided an incredibly insightful and accurate reading that left me feeling empowered and guided. Their deep knowledge of astrology, combined with a warm, intuitive approach, made the session feel personal and profound. They explained complex astrological concepts in a clear, relatable way, offering practical advice for navigating life''s challenges. I was amazed at how spot-on their predictions and interpretations were. Highly recommend Neelabh Shivam for anyone seeking clarity and cosmic wisdom.',
   5, 'Google review', true, true, 2),
  ('anand mohan', null,
   'Had a wonderful session. The in depth knowledge of Neelabh sir is amazing and onto the mark. The accuracy of his predictions is highly commendable. The remedies and safeguards suggested by him have been really helpful. Truly blessed to have a mentor like him.',
   5, 'Google review', true, true, 3),
  ('Gayatri V.', null,
   'I had a wonderful session with Neelabh sir. It was truly an enlightening experience. He has a profound knowledge of astrology. He is really good with decoding the past life karma and giving simple solutions to balance the karmic cycle. Would highly recommend!',
   5, 'Google review', true, true, 4),
  ('Smita B', null,
   E'Very polite and humble and knowledgeable person. He studies well about your chart and explains you about your past and current life. Whatver he explained, I was convinced about my birth chart it was almost accurate.\nThanks Neelabh for your service. God bless you.',
   4, 'Google review', true, true, 5),
  ('Deepesh garg', null,
   'I recently had a astro reading done from Neelabh bhai and honestly, it felt so accurate that I was left amazed. The way he explained the doshas connected to my past life made so much sense and matched with what I''ve been experiencing. …',
   5, 'Google review', true, true, 6),
  ('Pravesh Kumar', null,
   'I am deeply grateful to Neelabh bhaiya for the divine guidance he gave in the session. Neelabh bhaiya beautifully connected astrology with past life karma helping me understand my life''s challenges as part of a higher plan and helping me …',
   5, 'Google review', true, true, 7),
  ('Akshit Balana', 'Google Local Guide',
   'I had an amazing experience with Neelab Shivam Sir. The way he explained my past life readings was truly extraordinary. The insights he shared about my Kundli and planetary positions are things that no one has ever told me before. His depth …',
   5, 'Google review', true, true, 8),
  ('M Maan', null,
   'I had a great session with Neelabh Shivam bhaiya. All insights and revelations about past lives and the planetary positions are very helpful. I''m feeling very light and uplifted after discussing various aspects of my soul journey with …',
   5, 'Google review', true, true, 9)
) as v(author_name, author_detail, quote, rating, source, is_verified, is_published, sort_order)
where not exists (select 1 from public.testimonials t where lower(t.author_name) = lower(v.author_name) and lower(t.source) = lower(v.source));
