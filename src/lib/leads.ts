import { LEAD_STATUSES } from "@/lib/validation";
import type { Lead, LeadStatus } from "@/lib/types";

export const LEAD_COLUMNS = "id, name, email, phone, message, service_id, source, status, consent, admin_notes, created_at, updated_at";

export const leadTone: Record<LeadStatus, "saffron" | "green" | "grey" | "maroon" | "red"> = {
  new: "saffron",
  contacted: "maroon",
  qualified: "maroon",
  converted: "green",
  lost: "grey",
};

export interface LeadFilters {
  q: string;
  status: LeadStatus | "";
  source: string;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseLeadFilters(sp: Record<string, string | string[] | undefined>): LeadFilters {
  const status = first(sp.status);
  return {
    q: first(sp.q).trim().slice(0, 100),
    status: (LEAD_STATUSES as readonly string[]).includes(status) ? (status as LeadStatus) : "",
    source: first(sp.source).trim().slice(0, 60),
  };
}

/** Human label for the `source` value written by the website forms. */
export function sourceLabel(source: string): string {
  if (source === "contact-page") return "Contact page";
  if (source === "home-page") return "Home page";
  if (source.startsWith("service:")) return `Service page (${source.slice(8)})`;
  return source;
}

/** One CSV cell. Quotes are doubled; leading = + - @ are neutralised so spreadsheets never run them as formulas. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function leadsToCsv(rows: Array<Lead & { service_title?: string | null }>): string {
  const head = ["Received (UTC)", "Name", "Phone", "Email", "Interested in", "Message", "Source", "Status", "Notes"];
  const lines = [head.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.created_at, r.name, r.phone, r.email, r.service_title, r.message, sourceLabel(r.source), r.status, r.admin_notes]
        .map(csvCell)
        .join(","),
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n"; // BOM so Excel reads UTF-8 correctly
}
