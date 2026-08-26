import { trend } from '../../data/dashboard';

/** Hand-rolled SVG area chart — no chart library, ~2KB, themable via CSS vars. */
export function TrendChart() {
  const w = 640;
  const h = 180;
  const pad = { top: 14, right: 10, bottom: 24, left: 34 };
  const min = 60;
  const max = 100;

  const x = (i: number) => pad.left + (i / (trend.length - 1)) * (w - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - min) / (max - min)) * (h - pad.top - pad.bottom);

  const line = trend.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const area = `${line} L${x(trend.length - 1).toFixed(1)},${h - pad.bottom} L${x(0).toFixed(1)},${h - pad.bottom} Z`;
  const last = trend[trend.length - 1];

  return (
    <figure className="card p-5" aria-label={`Fleet compliance trend over 30 days, currently ${last.score} percent`}>
      <figcaption className="flex items-baseline justify-between mb-3">
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
          Fleet compliance — 30 days
        </span>
        <span className="mono text-[12px]" style={{ color: 'var(--ok)' }}>
          {last.score}% today
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-hidden className="w-full h-auto">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ok)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--ok)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[70, 80, 90, 100].map((g) => (
          <g key={g}>
            <line x1={pad.left} x2={w - pad.right} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.left - 8} y={y(g) + 3.5} textAnchor="end" fontSize="10" fill="var(--text-dim)">
              {g}%
            </text>
          </g>
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="var(--ok)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(trend.length - 1)} cy={y(last.score)} r="3.5" fill="var(--ok)" />
        {[0, 9, 19, 29].map((i) => (
          <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--text-dim)">
            {trend[i].day}
          </text>
        ))}
      </svg>
    </figure>
  );
}
