// Dependency-free SVG donut (pie) chart with an inline legend. Server-safe.
export type DonutSlice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 168,
  thickness = 26,
  centerValue,
  centerLabel,
  formatValue = (v) => String(v),
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
  formatValue?: (v: number) => string;
}) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <p className="px-5 py-8 text-center text-sm text-slate-400">No data to chart yet.</p>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;

  let acc = 0; // running fraction

  return (
    <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
          {/* track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {slices.map((d, i) => {
              const frac = d.value / total;
              const dash = frac * C;
              const el = (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-acc * C}
                  strokeLinecap="butt"
                />
              );
              acc += frac;
              return el;
            })}
          </g>
        </svg>
        {(centerValue || centerLabel) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-lg font-bold text-slate-900">{centerValue}</span>}
            {centerLabel && <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{centerLabel}</span>}
          </div>
        )}
      </div>

      {/* legend */}
      <ul className="w-full min-w-0 flex-1 space-y-1.5">
        {slices.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="min-w-0 flex-1 truncate text-slate-700">{d.label}</span>
              <span className="shrink-0 font-semibold text-slate-900">{formatValue(d.value)}</span>
              <span className="w-9 shrink-0 text-right text-xs text-slate-400">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
