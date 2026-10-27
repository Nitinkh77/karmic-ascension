import { NextResponse } from "next/server";
import { getSignedInUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Tells the header whether the visitor is signed in. Returns nothing about the user except yes/no. */
export async function GET() {
  const user = await getSignedInUser();
  return NextResponse.json({ signedIn: !!user }, { headers: { "Cache-Control": "no-store" } });
}
