"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { ActionState } from "@/lib/types";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** Wraps a form around a Server Action with pending, error and success feedback. */
export function AdminForm({
  action,
  children,
  submitLabel = "Save changes",
  resetOnSuccess = false,
  className,
  hideSubmit = false,
  danger = false,
  confirmMessage,
}: {
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  className?: string;
  hideSubmit?: boolean;
  danger?: boolean;
  /** When set, the browser asks for confirmation before submitting (use for deletes). */
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className ?? "space-y-5"}
      noValidate
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
      <div aria-live="polite">
        {state?.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={
              state.ok
                ? "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-success"
                : "rounded-lg border border-danger/40 bg-red-50 px-3 py-2 text-sm font-medium text-danger"
            }
          >
            {state.message}
          </p>
        )}
        {state && !state.ok && state.errors && Object.keys(state.errors).length > 0 && (
          <ul role="alert" className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-danger">
            {Object.entries(state.errors).map(([field, msg]) => (
              <li key={field}>
                <span className="font-semibold">{field.replace(/_/g, " ")}:</span> {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
      {!hideSubmit && (
        <Button type="submit" disabled={pending} variant={danger ? "danger" : "primary"}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      )}
    </form>
  );
}

/** Server-error-aware field wrapper. `errors` comes from the action result via <FormErrors>. */
export function Field({
  label,
  name,
  hint,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-charcoal">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Check({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-5 w-5 accent-maroon" />
      <span>
        <span className="font-semibold text-charcoal">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
    </label>
  );
}

export function PageTitle({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl text-maroon sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-soft">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-sand bg-white-warm p-5 shadow-card sm:p-6 ${className}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gold bg-white-warm p-8 text-center text-ink-soft">{children}</div>
  );
}
