import { Mandala } from "@/components/art/Mandala";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <Mandala className="h-16 w-16 animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
