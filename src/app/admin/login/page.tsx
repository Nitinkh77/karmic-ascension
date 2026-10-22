import { redirect } from "next/navigation";
import { Emblem } from "@/components/art/Ornaments";
import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (isSupabaseConfigured && (await getCurrentAdmin())) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment px-5 py-12">
      <div className="ornate-frame w-full max-w-md rounded-2xl p-8 sm:p-10">
        <Emblem className="mx-auto h-14 w-14" />
        <h1 className="mt-5 text-center text-3xl text-maroon">Admin sign in</h1>
        <p className="mt-2 text-center text-sm text-ink-soft">Karmic Ascension site management</p>

        {!isSupabaseConfigured ? (
          <p role="status" className="mt-6 rounded-xl border border-saffron/40 bg-saffron-soft p-4 text-sm">
            <strong>Setup required.</strong> Add your Supabase keys to <code>.env.local</code>, run the migrations and create
            the first admin (README steps 3–6). Sign-in is disabled until then.
          </p>
        ) : (
          <>
            {error === "unauthorized" && (
              <p role="alert" className="mt-6 rounded-xl border border-danger/40 bg-red-50 p-3 text-sm text-danger">
                Please sign in with an administrator account.
              </p>
            )}
            <LoginForm />
          </>
        )}
      </div>
    </main>
  );
}
