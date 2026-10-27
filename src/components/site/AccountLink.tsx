"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { supabaseUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

/** "Sign in" for visitors, "Sign out" once signed in. Reads the session cookie in the browser (no network call). */
export function AccountLink({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabaseUrl) return;
    const sb = createBrowserSupabase();
    sb.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  if (signedIn === null) return null;
  const base = "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-maroon hover:bg-parchment";
  if (!signedIn) return <Link href="/login" className={cn(base, className)}>Sign in</Link>;
  return (
    <button
      type="button"
      className={cn(base, className)}
      onClick={async () => {
        await createBrowserSupabase().auth.signOut();
        window.location.assign("/login");
      }}
    >
      Sign out
    </button>
  );
}
