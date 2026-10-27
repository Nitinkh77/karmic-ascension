import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

/** GET /admin/customers/export → CSV of customer sign-ups. Admin only (checked here, and again by RLS). */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse("Not authorised", { status: 401 });
  const { data, error } = await admin.supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return new NextResponse("Could not export customers.", { status: 500 });
  const lines = [["Name", "Email", "Joined (UTC)"].map(cell).join(",")];
  for (const r of data ?? []) lines.push([r.full_name, r.email, r.created_at].map(cell).join(","));
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
