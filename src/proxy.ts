import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 "proxy" (formerly middleware). Jobs:
 *   1. refresh the Supabase session cookie, and
 *   2. send anonymous visitors to the admin login (admin pages) or the customer login (everything except
 *      the public pages below).
 * This is a convenience gate. REAL authorisation happens on the server in
 * requireAdmin() (layout) and in every Server Action, backed by RLS.
 */
/** Pages anyone can open without signing in. Policy pages stay public (required for Google sign-in review). */
const PUBLIC_PATHS = new Set(["/", "/login", "/privacy", "/terms", "/cancellation-refund"]);

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  const configured = url && key && !/YOUR-/i.test(url) && !/YOUR-/i.test(key);
  if (!configured) return NextResponse.next(); // pages render their own "setup required" state

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Local token check (fast). Also refreshes the session cookie when the token is near expiry.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims?.sub ? claimsData.claims : null;

  if (!user) {
    const login = request.nextUrl.clone();
    if (pathname.startsWith("/admin")) {
      if (pathname !== "/admin/login") {
        login.pathname = "/admin/login";
        login.search = "";
        return NextResponse.redirect(login);
      }
    } else if (!PUBLIC_PATHS.has(pathname)) {
      // Visitors must sign in to look around; send them back to where they were headed afterwards.
      const next = pathname + request.nextUrl.search;
      login.pathname = "/login";
      login.search = `?next=${encodeURIComponent(next)}`;
      return NextResponse.redirect(login);
    }
  }
  return response;
}

export const config = {
  // Every page except static files and API routes (the API routes are rate limited on their own).
  matcher: ["/((?!_next/static|_next/image|api/|auth/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|txt|xml|woff2?)$).*)"],
};
