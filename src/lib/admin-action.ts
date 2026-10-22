import "server-only";
import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { getCurrentAdmin, type AdminContext } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

/**
 * Wraps every admin Server Action. Server Actions are public HTTP endpoints, so
 * EACH ONE re-verifies the session and admin role here, on the server, before
 * doing anything. (RLS in Postgres is the second, independent layer.)
 */
export async function adminAction(
  fn: (ctx: AdminContext) => Promise<ActionState>,
): Promise<ActionState> {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, message: "You are not authorised to do that. Please sign in again." };
    return await fn(admin);
  } catch (e) {
    // Let Next.js control-flow errors (redirect/notFound) pass through.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) {
      throw e;
    }
    console.error("[admin-action]", e);
    return { ok: false, message: "Something went wrong. Nothing was saved. Please try again." };
  }
}

/**
 * FormData → plain object. Files are skipped. Names listed in `checkboxes` become
 * real booleans (an unchecked checkbox is simply absent from FormData → false).
 */
export function formToObject(
  fd: FormData,
  checkboxes: string[] = [],
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  for (const name of checkboxes) {
    const v = fd.get(name);
    out[name] = v === "on" || v === "true";
  }
  return out;
}

export function parseWith<T>(
  schema: ZodType<T>,
  input: unknown,
): { ok: true; data: T } | { ok: false; state: NonNullable<ActionState> } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  const summary = Object.entries(errors)
    .map(([k, m]) => `${k.replace(/_/g, " ")}: ${m}`)
    .join(" · ");
  return { ok: false, state: { ok: false, message: `Not saved. ${summary}`, errors } };
}

/** Map a Postgres/PostgREST error to a friendly message. */
export function dbErrorMessage(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "23505":
      return "That value is already in use (it must be unique).";
    case "23P01":
      return "That time overlaps another pending or confirmed booking.";
    case "23514":
      return "A value was rejected by a database rule (for example, only verified testimonials can be published).";
    case "23503":
      return "This item is linked to other data and cannot be changed that way.";
    case "42501":
      return "You do not have permission to do that.";
    default:
      return "The database rejected that change.";
  }
}

export function refreshSite() {
  revalidatePath("/", "layout");
}
