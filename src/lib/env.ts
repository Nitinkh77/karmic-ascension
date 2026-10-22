// NOTE: NEXT_PUBLIC_* variables must be referenced with literal property access
// so Next.js can inline them into the client bundle.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const looksLikePlaceholder = (v?: string) => !v || /YOUR-|your-project|example\.supabase/i.test(v);

/** True only when real-looking Supabase URL + public key are present. */
export const isSupabaseConfigured =
  !looksLikePlaceholder(supabaseUrl) && !looksLikePlaceholder(supabaseKey);

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const MEDIA_BUCKET = "site-media";
