"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { customerSignIn, customerSignUp } from "@/app/(site)/login/actions";
import { Button } from "@/components/ui";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.3 0 20 0 24s.9 7.7 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function CustomerLoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState(customerSignIn, null);
  const [upState, upAction, upPending] = useActionState(customerSignUp, null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  async function google() {
    setGoogleBusy(true);
    setGoogleError("");
    const { error } = await createBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setGoogleBusy(false);
      setGoogleError("Google sign-in is not available right now. Please use email instead.");
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={google}
        disabled={googleBusy}
        className="spring inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-gold bg-white-warm px-6 font-semibold text-charcoal hover:bg-parchment disabled:opacity-60"
      >
        {googleBusy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <GoogleMark />}
        Continue with Google
      </button>
      {googleError && (
        <p role="alert" className="mt-3 rounded-xl border border-danger/40 bg-red-50 p-3 text-sm text-danger">
          {googleError}
        </p>
      )}

      <div className="my-6 flex items-center gap-3 text-sm text-ink-soft" aria-hidden="true">
        <span className="h-px flex-1 bg-sand" /> or use email <span className="h-px flex-1 bg-sand" />
      </div>

      <div role="tablist" aria-label="Sign in or create account" className="mb-5 grid grid-cols-2 rounded-full border border-sand bg-parchment p-1 text-sm font-semibold">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("min-h-10 rounded-full transition-colors", mode === m ? "bg-maroon text-ivory" : "text-charcoal")}
          >
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form key={mode} action={mode === "in" ? inAction : upAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        {state?.message && (
          <p role={state.ok ? "status" : "alert"} className={cn("rounded-xl border p-3 text-sm", state.ok ? "border-success/40 bg-green-50 text-success" : "border-danger/40 bg-red-50 text-danger")}>
            {state.message}
          </p>
        )}
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-sm font-semibold">Email</label>
          <input id="c-email" name="email" type="email" autoComplete="email" required className="field" aria-invalid={!!state?.errors?.email} />
          {state?.errors?.email && <p className="mt-1 text-sm text-danger">{state.errors.email}</p>}
        </div>
        <div>
          <label htmlFor="c-pass" className="mb-1.5 block text-sm font-semibold">Password</label>
          <input id="c-pass" name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={mode === "up" ? 8 : undefined} className="field" aria-invalid={!!state?.errors?.password} />
          {state?.errors?.password && <p className="mt-1 text-sm text-danger">{state.errors.password}</p>}
          {mode === "up" && <p className="mt-1 text-xs text-ink-soft">At least 8 characters.</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Please wait…</>) : mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
