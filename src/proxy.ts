import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 "proxy" (formerly middleware). Two jobs, only for /admin routes:
 *   1. refresh the Supabase session cookie, and
 *   2. send anonymous visitors to the login page early.
 * This is a convenience gate. REAL authorisation happens on the server in
 * requireAdmin() (layout) and in every Server Action, backed by RLS.
 */
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

  if (!user && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
