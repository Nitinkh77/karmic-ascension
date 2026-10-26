import { RASHIS } from "@/lib/astro/constants";
import type { Chart } from "@/lib/astro/chart";

/** House polygons and label anchors for the North Indian (diamond) chart on a 400×400 canvas. House 1 is the top diamond. */
const HOUSES: Array<{ pts: string; cx: number; cy: number }> = [
  { pts: "200,200 100,100 200,0 300,100", cx: 200, cy: 100 },
  { pts: "0,0 200,0 100,100", cx: 100, cy: 36 },
  { pts: "0,0 100,100 0,200", cx: 36, cy: 100 },
  { pts: "100,100 0,200 100,300 200,200", cx: 100, cy: 200 },
  { pts: "0,200 100,300 0,400", cx: 36, cy: 300 },
  { pts: "0,400 100,300 200,400", cx: 100, cy: 364 },
  { pts: "200,200 100,300 200,400 300,300", cx: 200, cy: 300 },
  { pts: "200,400 300,300 400,400", cx: 300, cy: 364 },
  { pts: "400,400 300,300 400,200", cx: 364, cy: 300 },
  { pts: "300,100 200,200 300,300 400,200", cx: 300, cy: 200 },
  { pts: "400,200 300,100 400,0", cx: 364, cy: 100 },
  { pts: "400,0 300,100 200,0", cx: 300, cy: 36 },
];

/** Whole-sign North Indian chart. Numbers are sign numbers (1 = Mesha … 12 = Meena); the top diamond is the Lagna. */
export function NorthIndianChart({ chart, className }: { chart: Chart; className?: string }) {
  const byHouse = new Map<number, string[]>();
  for (const p of chart.planets) {
    const list = byHouse.get(p.house) ?? [];
    list.push(`${p.id}${p.retrograde && p.id !== "Ra" && p.id !== "Ke" ? "ᴿ" : ""}`);
    byHouse.set(p.house, list);
  }
  const desc = HOUSES.map((_, i) => {
    const h = i + 1;
    const sign = RASHIS[chart.houses[i] - 1].sanskrit;
    const occupants = (byHouse.get(h) ?? []).join(", ") || "empty";
    return `House ${h}, ${sign}: ${occupants}`;
  }).join(". ");

  return (
    <svg viewBox="-6 -6 412 412" role="img" aria-label={`North Indian birth chart. ${desc}`} className={className}>
      <rect x="0" y="0" width="400" height="400" fill="var(--color-white-warm)" stroke="var(--color-gold)" strokeWidth="2" />
      {HOUSES.map((h, i) => (
        <polygon key={i} points={h.pts} fill={i === 0 ? "var(--color-parchment)" : "none"} stroke="var(--color-gold)" strokeWidth="1.5" />
      ))}
      {HOUSES.map((h, i) => {
        const occupants = byHouse.get(i + 1) ?? [];
        const size = occupants.length > 3 ? 12 : 14;
        const startY = h.cy - ((occupants.length - 1) * (size + 3)) / 2 + 2;
        return (
          <g key={i} textAnchor="middle" aria-hidden="true">
            <text x={h.cx} y={h.cy - (occupants.length ? ((occupants.length - 1) * (size + 3)) / 2 + 12 : 0) - (i === 0 ? 4 : 0)} fontSize="11" fill="var(--color-ink-soft)">
              {chart.houses[i]}
            </text>
            {occupants.map((o, k) => (
              <text key={o} x={h.cx} y={startY + k * (size + 3) + 4} fontSize={size} fontWeight={600} fill="var(--color-maroon)">
                {o}
              </text>
            ))}
            {i === 0 && (
              <text x={h.cx} y={h.cy + 46} fontSize="10" letterSpacing="1.5" fill="var(--color-saffron-deep)">
                LAGNA
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
