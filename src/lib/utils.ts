export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** 150000 paise → "₹1,500". null → null (caller decides how to word "price on request"). */
export function formatPrice(paise: number | null | undefined, currency = "INR"): string | null {
  if (paise === null || paise === undefined) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

/** "1500" or "1,500.50" → paise (integer). Returns null for blank, NaN for invalid. */
export function rupeesToPaise(input: string | null | undefined): number | null {
  const v = (input ?? "").replace(/[,\s₹]/g, "").trim();
  if (v === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return Number.NaN;
  return Math.round(parseFloat(v) * 100);
}

export function paiseToRupeesInput(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** Only allow same-site paths or http(s)/mailto/tel URLs from editable content. */
export function safeHref(href: string | null | undefined, fallback = "#"): string {
  if (!href) return fallback;
  const v = href.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  return fallback;
}

export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Lines "Title | Text" → items. Lines without a pipe become title-only. */
export function parseItems(raw: string): Array<{ title: string; text: string }> {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("|");
      return i === -1
        ? { title: line, text: "" }
        : { title: line.slice(0, i).trim(), text: line.slice(i + 1).trim() };
    });
}

export function itemsToText(items: Array<{ title: string; text: string }>): string {
  return items.map((i) => (i.text ? `${i.title} | ${i.text}` : i.title)).join("\n");
}

export function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Same-site relative path only (blocks open redirects like //evil.com or https://…). */
export function safeNext(next: string | null | undefined, fallback = "/services"): string {
  const v = (next ?? "").trim();
  if (v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") && !v.startsWith("/login") && !v.startsWith("/auth")) return v;
  return fallback;
}
