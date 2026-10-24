# Karmic Ascension – Vedic Astrology™

Website, consultation booking system and admin CMS for **Karmic Ascension – Vedic Astrology™** (Neelabh Shivam, Prayagraj).

Next.js (App Router, TypeScript strict) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Zod · Framer Motion · Lucide.

> **Status in one line:** the code is complete for the agreed scope, the database layer and the pure logic were tested, but the full app has **not yet been built or run end-to-end** (see [What was and wasn't verified](#what-was-and-wasnt-verified)). Do steps 1–7 below, then run the checklist in section 9.

---

## 1. Prerequisites (Windows)

- **Node.js 20.9+** (LTS 22 recommended): <https://nodejs.org>
- **VS Code**: <https://code.visualstudio.com>
- A free **Supabase** project: <https://supabase.com>
- Optional: **Git** for Windows, **Supabase CLI** (only if you prefer migrations from the command line)

## 2. Open and install

```powershell
cd path\to\karmic-ascension
code .
npm install
```

## 3. Environment variables

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` (never commit it — `.gitignore` already excludes it):

| Variable | Where to find it | Needed for |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your domain in production | canonical URLs, sitemap |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | everything |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | same page, "publishable / anon" key | everything |
| `SUPABASE_SERVICE_ROLE_KEY` | same page, "service_role" key — **secret** | public booking submission + confirmation page only |
| `RAZORPAY_*` | — | **not used yet** |

The service-role key is read only in server code (`src/lib/supabase/admin.ts`) and is never sent to the browser. Do not prefix it with `NEXT_PUBLIC_`.

**Without credentials the site still starts**: it shows built-in draft content, a visible "Setup required" banner, disables booking and admin sign-in, and never pretends anything was saved.

## 4. Create the database

In the Supabase dashboard open **SQL Editor → New query**, then paste and run these files **in this order** (already applied the first four? run #5 and #6):

1. `supabase/migrations/20261022000001_schema.sql` – tables, constraints, triggers
2. `supabase/migrations/20261022000002_functions.sql` – booking function, public availability function
3. `supabase/migrations/20261022000003_rls.sql` – Row Level Security
4. `supabase/migrations/20261022000004_storage.sql` – `site-media` bucket + admin-only write policies
5. `supabase/migrations/20261023000005_grants.sql` – explicit least-privilege table grants. **Required**: without it every query fails with `42501 permission denied for table …`
6. `supabase/migrations/20261024000006_leads.sql` – lead generation: `leads` table (admin-only RLS) and the `create_lead()` function used by the website forms
7. `supabase/seed.sql` – settings, pages, the services named on the existing site, FAQs, weekly hours (seed is safe to re-run)
8. `supabase/services_import.sql` – the 9 consultations from the existing website, with their real prices and durations (descriptions flagged for review)

(Alternative with the CLI: `supabase link --project-ref <ref>` then `supabase db push`, then run `seed.sql` in the SQL Editor.)

## 4b. Leads (enquiries)

Visitors can send an enquiry from **Contact** and from every **service page**. Each enquiry needs a name, a phone or an email, and a ticked consent box. It is stored through `create_lead()` (server only, honeypot + rate limit + a durable limit of 3 per email/phone per 24 h) and appears in **Admin → Leads**, where you can search, filter, set the status (new → contacted → qualified → converted / lost), keep private notes, call / WhatsApp / email the person, delete a lead, and **Export CSV**. The dashboard shows how many leads are new. Nothing is sent by e-mail or WhatsApp automatically.

## 5. Create the first admin (secure)

There is deliberately **no** public sign-up and no way to become admin from the browser.

1. Supabase → **Authentication → Users → Add user** → enter your email and a strong password (tick "Auto confirm user").
2. A profile with role `user` is created automatically. Promote it in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

3. Also in Supabase → **Authentication → Providers → Email**, **disable "Allow new users to sign up"** so strangers cannot create accounts.

## 6. Run

```powershell
npm run dev
```

Open <http://localhost:3000> and <http://localhost:3000/admin>.

## 7. Before you go live — owner tasks

The existing site publishes **no prices**, no working days and no policy text, so none were invented:

- **Admin → Services & pricing**: set real prices/durations, review the services flagged "needs review", publish/unpublish. Services with no price show "Price on request".
- **Admin → Availability**: tick your working days (all seeded *off*, 7:00–8:30 pm IST per the existing site). Online booking stays closed until at least one day is on.
- **Admin → Website content**: write the About biography; review the three policy pages (flagged *draft*, hidden from search engines until you untick "Draft"). The refund section is a placeholder: copy your confirmed terms in.
- **Admin → Settings**: add the AstroSage URL (not available when the site was inspected); confirm payment details.
- **Admin → Testimonials**: nothing is shown until you add genuine ones and tick *Verified* + *Published*.
- **Admin → Media**: upload images (see `docs/ASSETS.md`).
- Verify the Navagraha prayer transliteration/meaning (added beside the original Devanagari verse; flagged for review).

## 8. How it works

- **Public content** is read with the anonymous key; RLS exposes only published pages/sections, published services and verified+published testimonials.
- **Booking**: browser → `/api/slots` (read-only, rate-limited) → form → Server Action `submitBooking` (honeypot, per-IP rate limit, Zod) → Postgres function `create_booking()` which **re-validates everything** (service published, notice window, weekly hours in IST, blocked dates, ≤3 pending requests per email/phone per 24 h) and inserts. A PostgreSQL **exclusion constraint** makes double-booking impossible even under concurrent requests. Price and duration are snapshotted from the `services` table, never taken from the browser.
- **Payment (manual, for now)**: the confirmation page shows your Paytm/PhonePe/GPay details. Bookings are created `pending` / `unpaid`. **Only an admin can mark a booking paid.** Returning to the confirmation page never changes status.
- **Confirmation page** shows one booking only if both the public code and a secret random token (in the link) match.
- **Admin**: `src/proxy.ts` (Next 16 proxy) refreshes the session and redirects anonymous visitors, but real authorisation is enforced again in the admin layout and **inside every Server Action** (`adminAction`), plus RLS (`is_admin()`) in the database.
- **Time zone**: instants stored as UTC `timestamptz`; all business rules in `Asia/Kolkata`.

## 9. Test checklist (do this after `npm install`)

```powershell
npm run typecheck
npm run lint
npm run build
npm run dev
```

Then by hand: (1) site loads with no Setup banner; (2) `/admin` redirects to login when signed out; (3) a non-admin user is refused; (4) admin edits a price → appears on `/services`; (5) upload an image and attach it to a service; (6) enable a weekday, book a slot as a visitor, see it in Admin → Bookings; (7) try booking the same slot again → refused; (8) mark payment → status changes only in admin; (9) check on a phone-width window.

## 10. Later: Razorpay

The booking system is provider-agnostic (`src/lib/payments/provider.ts`, `payments` table with unique indexes for idempotency). To add Razorpay: implement the provider (create order server-side, verify signature server-side), add a webhook route verifying `X-Razorpay-Signature`, and set `bookings.payment_status='paid'` **only** after verification. Env vars are already reserved in `.env.example`.

## 11. Deploy (Vercel)

Import the repo, add the same environment variables (set `NEXT_PUBLIC_SITE_URL` to your domain), deploy. In Supabase → Authentication → URL Configuration, set the Site URL to your domain.

**Known limits:** the in-memory rate limiter is per server instance (the database backstop in `create_booking()` is durable); no e-mail/WhatsApp notifications are sent (new bookings appear in the dashboard; customers get a WhatsApp link for payment proof).

## What was and wasn't verified

| Verified (really run) | Not verified |
|---|---|
| All 4 migrations + seed apply cleanly to PostgreSQL 16 (re-runnable) | `npm install`, `next build`, ESLint (package registry was unreachable in the build environment) |
| `create_booking()`: valid slot, same/overlapping/buffer slots rejected, outside hours, past time, blocked day/range, 4th pending request, 8 parallel requests for one slot → exactly 1 succeeds | Supabase *hosted* behaviour: Auth login, Storage upload, PostgREST/RPC calls from the app |
| RLS: anonymous cannot read/insert bookings, payments, profiles; non-admin cannot self-promote or write; unverified testimonials cannot be published | Admin Server Actions and pages executed against a live database |
| Slot generator (TypeScript) agrees with the database on 48 candidate slots (19 offered all accepted, 29 hidden all rejected) | Real fonts (Cormorant Garamond) and browser behaviour of the mobile menu |
| Zod schemas and utilities: 65+ assertions incl. hostile input | Cross-browser testing |
| App code type-checked with `tsc` (strict null checks) against my own modules, third-party packages stubbed | |
| Public home & booking page rendered to HTML with the real stylesheet and screenshotted at 1280 px and 390 px: no horizontal overflow | |

## Site structure & motion

Pages: Home, Services (+ detail), Process (`/how-it-works`), Reviews (`/reviews`), About, FAQ (`/faq`), Contact, Book.
Process, Reviews and FAQ read their text from the **Home** page sections in Admin → Website content (keys `process`, `why`, `testimonials`, `faqs`).

Smooth scroll uses the `lenis` package (`npm install` after pulling). Animations respect the visitor's reduced-motion setting.
Public pages refresh from the database every 60 seconds.
