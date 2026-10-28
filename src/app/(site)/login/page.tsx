import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Emblem } from "@/components/art/Ornaments";
import { CustomerLoginForm } from "@/components/site/CustomerLoginForm";
import { getSignedInUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNext } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  if (isSupabaseConfigured && (await getSignedInUser())) redirect(next);

  return (
    <section className="px-5 py-6 sm:py-8">
      <div className="ornate-frame mx-auto w-full max-w-md rounded-2xl p-6 sm:p-7">
        <Emblem className="mx-auto h-11 w-11" />
        <h1 className="mt-3 text-center text-2xl text-maroon sm:text-3xl">Sign in to continue</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">Free account. Explore consultations, horoscope and kundali, and book a session.</p>
        {error === "callback" && (
          <p role="alert" className="mt-6 rounded-xl border border-danger/40 bg-red-50 p-3 text-sm text-danger">
            Sign-in did not complete. Please try again.
          </p>
        )}
        {!isSupabaseConfigured ? (
          <p role="status" className="mt-6 rounded-xl border border-saffron/40 bg-saffron-soft p-4 text-sm">Sign-in is not set up yet.</p>
        ) : (
          <CustomerLoginForm next={next} />
        )}
        <p className="mt-4 text-center text-xs text-ink-soft">
          By continuing you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </section>
  );
}
