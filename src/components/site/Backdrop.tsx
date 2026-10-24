import { cn } from "@/lib/utils";

/**
 * Decorative morphing shapes that sit behind a section's content.
 * Put `relative isolate overflow-hidden` on the parent section. Purely visual: hidden from assistive tech.
 */
export function Backdrop({ className, variant = "soft" }: { className?: string; variant?: "soft" | "bold" }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="parallax absolute inset-0">
        <span className="bubble -right-16 top-6 h-56 w-56 sm:h-80 sm:w-80" />
        <span
          className={cn("bubble bubble-ring -left-10 bottom-4 h-40 w-40 sm:h-64 sm:w-64", variant === "bold" && "opacity-90")}
          style={{ animationDelay: "-6s" }}
        />
        <span className="bubble left-1/3 top-2/3 hidden h-28 w-28 md:block" style={{ animationDelay: "-11s" }} />
      </div>
    </div>
  );
}
