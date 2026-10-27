import { Emblem } from "@/components/art/Ornaments";

/** Shown while a page is loading. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-gold-soft border-t-gold motion-reduce:animate-none" aria-hidden="true" />
        <Emblem className="h-16 w-16 animate-pulse rounded-full motion-reduce:animate-none" />
      </span>
      <span className="text-sm text-ink-soft">Loading…</span>
    </div>
  );
}
