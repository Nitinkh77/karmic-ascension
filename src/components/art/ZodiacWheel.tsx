import { Mandala } from "@/components/art/Mandala";
import { cn } from "@/lib/utils";

/**
 * Hero artwork: a mandala ringed by the twelve rāśi (zodiac) glyphs and
 * nine graha (planet) markers. Pure SVG + text, so it stays sharp at any size.
 * The U+FE0E selector forces text (not emoji) presentation of the glyphs.
 */
const RASHI = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const GRAHA = ["☉", "☽", "♂", "☿", "♃", "♀", "♄", "☊", "☋"];
const TEXT = "︎";

export function ZodiacWheel({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square w-full", className)} aria-hidden="true">
      <Mandala className="absolute inset-[11%] h-[78%] w-[78%] text-gold" spin />
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full" fill="none">
        <circle r="98" stroke="var(--color-gold)" strokeWidth="0.7" />
        <circle r="80" stroke="var(--color-gold)" strokeOpacity="0.55" strokeWidth="0.5" />
        {RASHI.map((g, i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          return (
            <g key={g}>
              <line
                x1={80 * Math.cos(a + Math.PI / 12)}
                y1={80 * Math.sin(a + Math.PI / 12)}
                x2={98 * Math.cos(a + Math.PI / 12)}
                y2={98 * Math.sin(a + Math.PI / 12)}
                stroke="var(--color-gold)"
                strokeOpacity="0.55"
                strokeWidth="0.5"
              />
              <text
                x={89 * Math.cos(a)}
                y={89 * Math.sin(a)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fill="var(--wheel-glyph, var(--color-maroon))"
              >
                {g + TEXT}
              </text>
            </g>
          );
        })}
        {GRAHA.map((g, i) => {
          const a = ((i * 40 - 90) * Math.PI) / 180;
          return (
            <g key={g}>
              <circle cx={52 * Math.cos(a)} cy={52 * Math.sin(a)} r="6.2" fill="var(--wheel-bg, var(--color-ivory))" stroke="var(--color-gold)" strokeWidth="0.6" />
              <text
                x={52 * Math.cos(a)}
                y={52 * Math.sin(a)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7.5"
                fill="var(--wheel-glyph, var(--color-saffron-deep))"
              >
                {g + TEXT}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
