import { cn } from "@/lib/utils";

/** Thin gold rule with a small lotus-diamond in the middle. */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-gold", className)} aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold sm:w-28" />
      <svg viewBox="0 0 40 16" className="h-4 w-10" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M20 1 L25 8 L20 15 L15 8 Z" />
        <path d="M20 4 L22.5 8 L20 12 L17.5 8 Z" fill="currentColor" stroke="none" />
        <path d="M13 8 C9 4, 5 4, 1 8 C5 12, 9 12, 13 8 Z" strokeOpacity="0.7" />
        <path d="M27 8 C31 4, 35 4, 39 8 C35 12, 31 12, 27 8 Z" strokeOpacity="0.7" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold sm:w-28" />
    </div>
  );
}

/** Corner flourish for framed cards. Rotate via className (e.g. rotate-90). */
export function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-10 w-10 text-gold", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <path d="M2 46 V14 C2 7 7 2 14 2 H46" />
      <path d="M8 40 V16 C8 11 11 8 16 8 H40" strokeOpacity="0.55" />
      <circle cx="14" cy="14" r="2.2" fill="currentColor" stroke="none" />
      <path d="M14 14 C20 14, 22 20, 28 20" strokeOpacity="0.7" />
      <path d="M14 14 C14 20, 20 22, 20 28" strokeOpacity="0.7" />
    </svg>
  );
}

/** Soft scalloped band used as a section edge. */
export function ScallopBand({ className }: { className?: string }) {
  return (
    <svg
      className={cn("block h-4 w-full text-gold-soft", className)}
      preserveAspectRatio="none"
      viewBox="0 0 240 16"
      aria-hidden="true"
    >
      <defs>
        <pattern id="ka-scallop" width="24" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 0 H24 V3 C24 11, 12 16, 12 16 C12 16, 0 11, 0 3 Z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="240" height="16" fill="url(#ka-scallop)" />
    </svg>
  );
}

/** Brand emblem (also used as favicon source). */
export function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={cn("h-10 w-10", className)} aria-hidden="true">
      <circle r="48" fill="var(--color-maroon)" />
      <circle r="44" fill="none" stroke="var(--color-gold-soft)" strokeWidth="1" />
      <g stroke="var(--color-gold-soft)" strokeWidth="1.1" fill="none">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M0 -38 C 6 -30, 6 -22, 0 -15 C -6 -22, -6 -30, 0 -38 Z" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="11" />
        <path d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4 Z" fill="var(--color-gold-soft)" stroke="none" />
      </g>
    </svg>
  );
}
