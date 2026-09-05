import { SEGMENT_COUNT } from "@/lib/wheel-store";

const PALETTE = [
  "var(--wheel-1)",
  "var(--wheel-2)",
  "var(--wheel-3)",
  "var(--wheel-4)",
  "var(--wheel-5)",
];

/** Exact degrees the wheel face must sit at for segment `i` to be under the top pointer. */
export function targetRotationFor(i: number, currentRotation: number) {
  const seg = 360 / SEGMENT_COUNT;
  // pointer is at top (-90deg). Segment i spans [i*seg-90, (i+1)*seg-90) on the un-rotated wheel.
  // Center of segment i in wheel coords:
  const center = i * seg + seg / 2 - 90;
  // rotation + center ≡ -90 (mod 360)  -> rotation ≡ -90 - center
  const desiredMod = (((-90 - center) % 360) + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = desiredMod - currentMod;
  if (delta < 0) delta += 360;
  // add full extra turns for a long dramatic spin, plus tiny jitter inside the segment
  const jitter = (Math.random() - 0.5) * seg * 0.5;
  return currentRotation + 360 * 6 + delta + jitter;
}

export function SpinWheel({
  labels,
  rotation,
  spinning,
}: {
  labels: string[];
  rotation: number;
  spinning: boolean;
}) {
  const seg = 360 / SEGMENT_COUNT;
  const size = 520;
  const r = size / 2;
  const c = r;

  const slices = labels.map((label, i) => {
    const start = i * seg - 90;
    const end = start + seg;
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = c + r * Math.cos(rad(start));
    const y1 = c + r * Math.sin(rad(start));
    const x2 = c + r * Math.cos(rad(end));
    const y2 = c + r * Math.sin(rad(end));
    const mid = (start + end) / 2;
    const textR = r * 0.66;
    const tx = c + textR * Math.cos(rad(mid));
    const ty = c + textR * Math.sin(rad(mid));
    const norm = ((mid % 360) + 360) % 360;
    const textAngle = norm > 90 && norm < 270 ? mid + 180 : mid;
    return { label, i, x1, y1, x2, y2, tx, ty, textAngle };
  });

  return (
    <div className="wheel-shell">
      {/* pointer */}
      <div className="wheel-pointer" aria-hidden>
        <svg viewBox="0 0 48 56" className="h-14 w-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
          <path d="M24 54 L6 18 A22 22 0 0 1 42 18 Z" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="3" />
          <circle cx="24" cy="20" r="7" fill="var(--gold-deep)" />
        </svg>
      </div>

      <div
        className="wheel-face"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 5.2s cubic-bezier(0.12, 0.6, 0.05, 1)" : "none",
        }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
          <circle cx={c} cy={c} r={r} fill="var(--wheel-rim)" />
          {slices.map((s) => (
            <g key={s.i}>
              <path
                d={`M ${c} ${c} L ${s.x1} ${s.y1} A ${r - 4} ${r - 4} 0 0 1 ${s.x2} ${s.y2} Z`}
                fill={PALETTE[s.i % PALETTE.length]}
                stroke="var(--wheel-rim)"
                strokeWidth="2"
              />
              <text
                x={s.tx}
                y={s.ty}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${s.textAngle} ${s.tx} ${s.ty})`}
                fill="var(--wheel-text)"
                fontSize="16"
                fontWeight="700"
                fontFamily="inherit"
              >
                {s.label}
              </text>
            </g>
          ))}
          {/* rim lights */}
          {Array.from({ length: SEGMENT_COUNT * 2 }, (_, i) => {
            const a = ((i * 360) / (SEGMENT_COUNT * 2) - 90) * (Math.PI / 180);
            return (
              <circle
                key={i}
                cx={c + (r - 6) * Math.cos(a)}
                cy={c + (r - 6) * Math.sin(a)}
                r="5"
                fill={i % 2 === 0 ? "var(--gold)" : "var(--wheel-rim-light)"}
              />
            );
          })}
        </svg>
        {/* hub */}
        <div className="wheel-hub">
          <span>SPIN</span>
        </div>
      </div>
    </div>
  );
}
