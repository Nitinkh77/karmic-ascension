"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction, dbErrorMessage, formToObject, parseWith, refreshSite } from "@/lib/admin-action";
import { MEDIA_BUCKET } from "@/lib/env";
import { istToDate } from "@/lib/booking/slots";
import type { ActionState } from "@/lib/types";
import { parseItems, parseLines, rupeesToPaise, slugify } from "@/lib/utils";
import {
  blockedDateSchema,
  bookingNotesSchema,
  bookingPaymentSchema,
  bookingRescheduleSchema,
  bookingStatusSchema,
  faqSchema,
  leadNotesSchema,
  leadStatusSchema,
  mediaMetaSchema,
  pageMetaSchema,
  sectionSchema,
  serviceSchema,
  settingsSchema,
  testimonialSchema,
  weeklyHoursSchema,
} from "@/lib/validation";

const ok = (message: string): ActionState => ({ ok: true, message });
const fail = (message: string): ActionState => ({ ok: false, message });

/* ----------------------------------------------------------------- settings */

export async function saveSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(settingsSchema, formToObject(fd, ["announcement_active"]));
    if (!r.ok) return r.state;
    const { error } = await supabase.from("site_settings").update(r.data).eq("id", 1);
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    return ok("Settings saved.");
  });
}

export async function saveSlotConfig(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(
      settingsSchema.pick({ slot_minutes: true, buffer_minutes: true, min_notice_hours: true, max_advance_days: true }),
      formToObject(fd),
    );
    if (!r.ok) return r.state;
    const { error } = await supabase.from("site_settings").update(r.data).eq("id", 1);
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    return ok("Booking rules saved.");
  });
}

/* ------------------------------------------------------------------ content */

export async function savePageMeta(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(pageMetaSchema, formToObject(fd, ["is_published", "is_draft"]));
    if (!r.ok) return r.state;
    const { slug, ...rest } = r.data;
    const { error } = await supabase.from("pages").upsert({ slug, ...rest }, { onConflict: "slug" });
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    return ok("Page settings saved.");
  });
}

export async function saveSection(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(sectionSchema, formToObject(fd, ["is_visible", "is_draft"]));
    if (!r.ok) return r.state;
    const { slug, items_text, section_key, ...rest } = r.data;

    const { data: page, error: pErr } = await supabase.from("pages").select("id").eq("slug", slug).maybeSingle();
    if (pErr) return fail(dbErrorMessage(pErr));
    if (!page) return fail("Save the page settings first (this page has not been created in the database yet).");

    const { error } = await supabase.from("page_sections").upsert(
      { page_id: page.id, section_key, items: parseItems(items_text), ...rest },
      { onConflict: "page_id,section_key" },
    );
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    return ok("Section saved.");
  });
}

/** One click: create the page row (if missing) so its sections can be edited. */
export async function ensurePage(slug: string, title: string) {
  await adminAction(async ({ supabase }) => {
    await supabase.from("pages").upsert({ slug, title }, { onConflict: "slug", ignoreDuplicates: true });
    return ok("created");
  });
  revalidatePath(`/admin/content/${slug}`);
}

/* ----------------------------------------------------------------- services */

export async function saveService(_p: ActionState, fd: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;
  const result = await adminAction(async ({ supabase }) => {
    const r = parseWith(serviceSchema, formToObject(fd, ["is_featured", "requires_birth_details", "is_draft"]));
    if (!r.ok) return r.state;
    const d = r.data;

    const paise = rupeesToPaise(d.price_rupees);
    if (Number.isNaN(paise)) return fail("Price must be a number such as 1500 or 1500.50 (leave empty for “price on request”).");
    if (paise !== null && paise > 100_000_000) return fail("Price is unreasonably large.");

    const row = {
      title: d.title,
      slug: d.slug ?? slugify(d.title),
      short_description: d.short_description,
      description: d.description,
      price_paise: paise,
      duration_minutes: d.duration_minutes,
      features: parseLines(d.features_text),
      deliverables: parseLines(d.deliverables_text),
      image_asset_id: d.image_asset_id,
      status: d.status,
      sort_order: d.sort_order,
      is_featured: d.is_featured,
      requires_birth_details: d.requires_birth_details,
      is_draft: d.is_draft,
    };
    if (!row.slug) return fail("Could not create a URL slug from the title. Enter one manually.");

    if (d.id) {
      const { error } = await supabase.from("services").update(row).eq("id", d.id);
      if (error) return fail(dbErrorMessage(error));
      refreshSite();
      return ok("Service saved. Existing bookings keep the price they were booked at.");
    }
    const { data, error } = await supabase.from("services").insert(row).select("id").single();
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    redirectTo = `/admin/services/${data.id}`;
    return ok("Service created.");
  });
  if (redirectTo) redirect(redirectTo);
  return result;
}

export async function deleteService(_p: ActionState, fd: FormData): Promise<ActionState> {
  let done = false;
  const result = await adminAction(async ({ supabase }) => {
    const id = String(fd.get("id") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("Invalid service.");
    // Bookings keep their snapshot (service_id becomes null), so deleting is safe for history.
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    done = true;
    return ok("Service deleted.");
  });
  if (done) redirect("/admin/services");
  return result;
}

/* --------------------------------------------------------------------- FAQs */

export async function saveFaq(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(faqSchema, formToObject(fd, ["is_published"]));
    if (!r.ok) return r.state;
    const { id, ...row } = r.data;
    const { error } = id
      ? await supabase.from("faqs").update(row).eq("id", id)
      : await supabase.from("faqs").insert(row);
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    revalidatePath("/admin/faqs");
    return ok(id ? "FAQ saved." : "FAQ added.");
  });
}

export async function deleteFaq(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const { error } = await supabase.from("faqs").delete().eq("id", String(fd.get("id") ?? ""));
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    revalidatePath("/admin/faqs");
    return ok("FAQ deleted.");
  });
}

/* ------------------------------------------------------------ testimonials */

export async function saveTestimonial(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(testimonialSchema, formToObject(fd, ["is_verified", "is_published"]));
    if (!r.ok) return r.state;
    const { id, ...row } = r.data;
    const { error } = id
      ? await supabase.from("testimonials").update(row).eq("id", id)
      : await supabase.from("testimonials").insert(row);
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    revalidatePath("/admin/testimonials");
    return ok(id ? "Testimonial saved." : "Testimonial added.");
  });
}

export async function deleteTestimonial(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", String(fd.get("id") ?? ""));
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    revalidatePath("/admin/testimonials");
    return ok("Testimonial deleted.");
  });
}

/* ------------------------------------------------------------ availability */

export async function saveWeeklyHours(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const rows: Array<{ weekday: number; start_time: string; end_time: string; is_active: boolean }> = [];
    for (let day = 0; day < 7; day++) {
      const r = parseWith(weeklyHoursSchema, {
        weekday: day,
        start_time: String(fd.get(`start_${day}`) ?? ""),
        end_time: String(fd.get(`end_${day}`) ?? ""),
        is_active: fd.get(`active_${day}`) === "on",
      });
      if (!r.ok) return r.state;
      rows.push(r.data);
    }
    const { error } = await supabase.from("availability_rules").upsert(rows, { onConflict: "weekday" });
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    return ok("Weekly hours saved. Existing bookings are not affected.");
  });
}

export async function addBlockedDate(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(blockedDateSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const { error } = await supabase.from("blocked_dates").insert(r.data);
    if (error) return fail(dbErrorMessage(error));
    revalidatePath("/admin/availability");
    return ok("Blocked. Note: existing bookings in this period are not cancelled automatically.");
  });
}

export async function removeBlockedDate(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const { error } = await supabase.from("blocked_dates").delete().eq("id", String(fd.get("id") ?? ""));
    if (error) return fail(dbErrorMessage(error));
    revalidatePath("/admin/availability");
    return ok("Removed.");
  });
}

/* -------------------------------------------------------------------- media */

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;

function sniff(buf: Uint8Array): string | null {
  const b = (i: number) => buf[i];
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45) return "image/webp";
  if (b(4) === 0x66 && b(5) === 0x74 && b(6) === 0x79 && b(7) === 0x70) return "image/avif";
  return null;
}

export async function uploadMedia(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase, user }) => {
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("Choose an image file to upload.");
    if (file.size > MAX_BYTES) return fail("That file is larger than 5 MB. Please compress it and try again.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    // Trust the file's real content, not its name or the browser-reported type.
    const mime = sniff(bytes);
    if (!mime || !MIME_EXT[mime]) return fail("Only PNG, JPG, WebP or AVIF images are allowed (SVG is not accepted for safety).");

    const alt = String(fd.get("alt_text") ?? "").trim().slice(0, 300);
    if (!alt) return fail("Please add alt text describing the image (used by screen readers and SEO).");
    const folderRaw = String(fd.get("folder") ?? "general");
    const folder = /^[a-z0-9-]{1,60}$/.test(folderRaw) ? folderRaw : "general";

    const base = slugify((file.name || "image").replace(/\.[^.]+$/, "")) || "image";
    const path = `${folder}/${randomUUID().slice(0, 8)}-${base}.${MIME_EXT[mime]}`;

    const up = await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType: mime, upsert: false });
    if (up.error) {
      console.error("[uploadMedia]", up.error);
      return fail("Upload failed. Check that the migrations created the “site-media” bucket and that you are signed in as admin.");
    }
    const { error } = await supabase.from("media_assets").insert({
      storage_path: path,
      folder,
      alt_text: alt,
      mime_type: mime,
      size_bytes: file.size,
      created_by: user.id,
    });
    if (error) {
      await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      return fail(dbErrorMessage(error));
    }
    revalidatePath("/admin/media");
    return ok("Image uploaded.");
  });
}

export async function updateMedia(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(mediaMetaSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const { id, ...row } = r.data;
    const { error } = await supabase.from("media_assets").update(row).eq("id", id);
    if (error) return fail(dbErrorMessage(error));
    refreshSite();
    revalidatePath("/admin/media");
    return ok("Saved.");
  });
}

/** Replace the file behind an existing asset (same record, same alt text). */
export async function replaceMedia(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const id = String(fd.get("id") ?? "");
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("Choose a replacement image.");
    if (file.size > MAX_BYTES) return fail("That file is larger than 5 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = sniff(bytes);
    if (!mime) return fail("Only PNG, JPG, WebP or AVIF images are allowed.");

    const { data: asset } = await supabase.from("media_assets").select("storage_path, folder").eq("id", id).maybeSingle();
    if (!asset) return fail("Image not found.");
    // New object name so CDN/browser caches never serve the old picture.
    const newPath = `${asset.folder}/${randomUUID().slice(0, 8)}-${slugify(asset.storage_path.split("/").pop()!.replace(/\.[^.]+$/, "").replace(/^[0-9a-f]{8}-/, "")) || "image"}.${MIME_EXT[mime]}`;
    const up = await supabase.storage.from(MEDIA_BUCKET).upload(newPath, bytes, { contentType: mime });
    if (up.error) return fail("Upload failed.");
    const { error } = await supabase
      .from("media_assets")
      .update({ storage_path: newPath, mime_type: mime, size_bytes: file.size })
      .eq("id", id);
    if (error) {
      await supabase.storage.from(MEDIA_BUCKET).remove([newPath]);
      return fail(dbErrorMessage(error));
    }
    await supabase.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
    refreshSite();
    revalidatePath("/admin/media");
    return ok("Image replaced everywhere it is used.");
  });
}

export async function deleteMedia(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const id = String(fd.get("id") ?? "");
    const { data: asset } = await supabase.from("media_assets").select("storage_path").eq("id", id).maybeSingle();
    if (!asset) return fail("Image not found.");
    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    if (error) return fail(dbErrorMessage(error));
    await supabase.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
    refreshSite();
    revalidatePath("/admin/media");
    return ok("Image deleted. Places that used it now show the default ornament.");
  });
}

/* ----------------------------------------------------------------- bookings */

export async function setBookingStatus(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(bookingStatusSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const { error } = await supabase.from("bookings").update({ status: r.data.status }).eq("id", r.data.id);
    if (error) return fail(dbErrorMessage(error)); // re-opening a cancelled booking can hit the overlap guard
    revalidatePath("/admin/bookings", "layout");
    return ok(`Status set to ${r.data.status}.`);
  });
}

export async function setPaymentStatus(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase, user }) => {
    const r = parseWith(bookingPaymentSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const { data: b } = await supabase
      .from("bookings")
      .select("id, service_price_paise, currency")
      .eq("id", r.data.id)
      .maybeSingle();
    if (!b) return fail("Booking not found.");

    const { error } = await supabase.from("bookings").update({ payment_status: r.data.payment_status }).eq("id", b.id);
    if (error) return fail(dbErrorMessage(error));

    // Keep a ledger row for manual verifications so there is a record of who verified what.
    if (r.data.payment_status === "paid") {
      await supabase.from("payments").insert({
        booking_id: b.id,
        provider: "manual",
        amount_paise: b.service_price_paise ?? 0,
        currency: b.currency,
        status: "verified",
        reference: r.data.reference,
        created_by: user.id,
      });
    }
    revalidatePath("/admin/bookings", "layout");
    return ok(`Payment marked “${r.data.payment_status.replace(/_/g, " ")}”.`);
  });
}

export async function saveBookingNotes(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(bookingNotesSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const { error } = await supabase.from("bookings").update({ admin_notes: r.data.admin_notes }).eq("id", r.data.id);
    if (error) return fail(dbErrorMessage(error));
    revalidatePath("/admin/bookings", "layout");
    return ok("Note saved.");
  });
}

export async function rescheduleBooking(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(bookingRescheduleSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const [{ data: b }, { data: st }] = await Promise.all([
      supabase.from("bookings").select("id, duration_minutes, status").eq("id", r.data.id).maybeSingle(),
      supabase.from("site_settings").select("buffer_minutes").eq("id", 1).maybeSingle(),
    ]);
    if (!b) return fail("Booking not found.");
    if (b.status === "cancelled" || b.status === "completed") return fail("Re-open the booking before rescheduling it.");

    const start = istToDate(r.data.date, r.data.time);
    if (Number.isNaN(start.getTime())) return fail("Invalid date or time.");
    const ends = new Date(start.getTime() + b.duration_minutes * 60_000);
    const held = new Date(ends.getTime() + (st?.buffer_minutes ?? 10) * 60_000);

    // The exclusion constraint rejects overlaps with other pending/confirmed bookings.
    const { error } = await supabase
      .from("bookings")
      .update({ starts_at: start.toISOString(), ends_at: ends.toISOString(), held_until: held.toISOString() })
      .eq("id", b.id);
    if (error) return fail(dbErrorMessage(error));
    revalidatePath("/admin/bookings", "layout");
    return ok("Rescheduled. Remember to tell the customer.");
  });
}

/* -------------------------------------------------------------------- leads */

export async function setLeadStatus(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(leadStatusSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const { error } = await supabase.from("leads").update({ status: r.data.status }).eq("id", r.data.id);
    if (error) return fail(dbErrorMessage(error));
    revalidatePath("/admin", "layout");
    return ok(`Lead marked ${r.data.status}.`);
  });
}

export async function saveLeadNotes(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const r = parseWith(leadNotesSchema, formToObject(fd));
    if (!r.ok) return r.state;
    const { error } = await supabase.from("leads").update({ admin_notes: r.data.admin_notes }).eq("id", r.data.id);
    if (error) return fail(dbErrorMessage(error));
    revalidatePath("/admin/leads", "layout");
    return ok("Note saved.");
  });
}

export async function deleteLead(_p: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async ({ supabase }) => {
    const id = String(fd.get("id") ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return fail("Invalid lead.");
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return fail(dbErrorMessage(error));
    revalidatePath("/admin", "layout");
    redirect("/admin/leads");
  });
}
