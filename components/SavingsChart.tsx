'use client';

interface Point { year: number; cumulative_savings: number }

export default function SavingsChart({ data }: { data: Point[] }) {
  const W = 600, H = 280, PAD = { top: 20, right: 20, bottom: 40, left: 70 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const minY = Math.min(0, ...data.map(d => d.cumulative_savings));
  const maxY = Math.max(...data.map(d => d.cumulative_savings));
  const range = maxY - minY || 1;

  const xScale = (year: number) => ((year - 1) / 24) * innerW;
  const yScale = (val: number) => innerH - ((val - minY) / range) * innerH;

  const polyline = data.map(d => `${xScale(d.year)},${yScale(d.cumulative_savings)}`).join(' ');
  const breakeven = data.find(d => d.cumulative_savings >= 0);
  const zeroY = yScale(0);

  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : n <= -1000 ? `-$${Math.round(-n / 1000)}k` : `$${n}`;

  const yTicks = 5;
  const tickVals = Array.from({ length: yTicks }, (_, i) => minY + (range / (yTicks - 1)) * i);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto" aria-label="25-year cumulative savings chart">
        <defs>
          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid lines */}
          {tickVals.map((v, i) => (
            <g key={i}>
              <line x1={0} y1={yScale(v)} x2={innerW} y2={yScale(v)} stroke="#f0f0f0" strokeWidth={1} />
              <text x={-8} y={yScale(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#9ca3af">{fmt(v)}</text>
            </g>
          ))}

          {/* Zero line */}
          {minY < 0 && <line x1={0} y1={zeroY} x2={innerW} y2={zeroY} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3" />}

          {/* Area fill */}
          <polyline
            points={`0,${yScale(data[0].cumulative_savings)} ${polyline} ${innerW},${innerH} 0,${innerH}`}
            fill="url(#savingsGrad)"
            stroke="none"
          />

          {/* Line */}
          <polyline points={polyline} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {/* Breakeven marker */}
          {breakeven && (
            <g transform={`translate(${xScale(breakeven.year)},${zeroY})`}>
              <circle r={5} fill="#f59e0b" stroke="white" strokeWidth={2} />
              <text x={6} y={-8} fontSize={10} fill="#92400e" fontWeight="600">Breakeven yr {breakeven.year}</text>
            </g>
          )}

          {/* Final value */}
          {data[24] && (
            <g transform={`translate(${xScale(25)},${yScale(data[24].cumulative_savings)})`}>
              <circle r={5} fill="#22c55e" stroke="white" strokeWidth={2} />
              <text x={-5} y={-10} textAnchor="end" fontSize={11} fill="#15803d" fontWeight="700">{fmt(data[24].cumulative_savings)}</text>
            </g>
          )}

          {/* X axis */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#e5e7eb" strokeWidth={1} />
          {[1, 5, 10, 15, 20, 25].map(yr => (
            <text key={yr} x={xScale(yr)} y={innerH + 20} textAnchor="middle" fontSize={11} fill="#9ca3af">yr {yr}</text>
          ))}
        </g>
      </svg>
    </div>
  );
}
