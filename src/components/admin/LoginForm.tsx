"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/app/admin/login/actions";
import { Button } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      {state?.message && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" aria-invalid={!!state?.errors?.email} />
        {state?.errors?.email && <p className="mt-1 text-sm text-danger">{state.errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" aria-invalid={!!state?.errors?.password} />
        {state?.errors?.password && <p className="mt-1 text-sm text-danger">{state.errors.password}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
