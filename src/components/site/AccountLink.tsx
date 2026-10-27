"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** "Sign in" for visitors, "Sign out" once signed in. The server decides, so it always matches the real session. */
export function AccountLink({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { signedIn: false }))
      .then((d: { signedIn?: boolean }) => alive && setSignedIn(!!d.signedIn))
      .catch(() => alive && setSignedIn(false));
    return () => {
      alive = false;
    };
  }, []);

  if (signedIn === null) return null;
  const base = "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-maroon hover:bg-parchment";
  if (!signedIn) return <Link href="/login" className={cn(base, className)}>Sign in</Link>;
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={cn(base, className)}>Sign out</button>
    </form>
  );
}
