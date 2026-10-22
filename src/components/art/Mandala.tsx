import { cn } from "@/lib/utils";

/**
 * Original geometric mandala (pure SVG, no external assets).
 * Decorative only → aria-hidden. Uses currentColor so callers set the tone.
 */
export function Mandala({
  className,
  rings = 3,
  spin = false,
}: {
  className?: string;
  rings?: 1 | 2 | 3;
  spin?: boolean;
}) {
  const petals = Array.from({ length: 16 }, (_, i) => i * (360 / 16));
  const inner = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  return (
    <svg
      viewBox="-100 -100 200 200"
      className={cn("text-gold", spin && "spin-slow", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
      aria-hidden="true"
      focusable="false"
    >
      <circle r="97" strokeWidth="0.8" />
      <circle r="94" strokeOpacity="0.5" />
      {ticks.map((a) => (
        <line key={a} x1="0" y1="-94" x2="0" y2={a % 15 === 0 ? -89 : -91.5} transform={`rotate(${a})`} strokeOpacity="0.7" />
      ))}

      {rings >= 3 &&
        petals.map((a) => (
          <path key={`o${a}`} d="M0 -86 C 7 -76, 7 -66, 0 -58 C -7 -66, -7 -76, 0 -86 Z" transform={`rotate(${a})`} />
        ))}
      <circle r="56" strokeOpacity="0.6" />

      {rings >= 2 &&
        petals.map((a) => (
          <path key={`m${a}`} d="M0 -54 C 9 -46, 9 -36, 0 -28 C -9 -36, -9 -46, 0 -54 Z" transform={`rotate(${a + 11.25})`} strokeOpacity="0.9" />
        ))}
      <circle r="27" />

      {inner.map((a) => (
        <path key={`i${a}`} d="M0 -26 C 5 -20, 5 -14, 0 -9 C -5 -14, -5 -20, 0 -26 Z" transform={`rotate(${a})`} />
      ))}
      {/* eight-point star */}
      <path d="M0 -17 L5 -5 L17 0 L5 5 L0 17 L-5 5 L-17 0 L-5 -5 Z" strokeWidth="0.8" />
      <circle r="4.5" strokeWidth="0.9" />
      <circle r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
