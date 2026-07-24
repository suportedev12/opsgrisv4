interface BarChartProps {
  data: { label: string; validados: number; pendencias: number; outros: number }[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  const max = Math.max(...data.map(d => d.validados + d.pendencias + d.outros), 1);
  const barWidth = 48;
  const gap = 28;
  const svgWidth = data.length * (barWidth + gap) + gap;
  const svgHeight = height + 40;

  return (
    <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = gap + i * (barWidth + gap);
        const totalH = Math.round(((d.validados + d.pendencias + d.outros) / max) * height);
        const valH = Math.round((d.validados / max) * height);
        const pendH = Math.round((d.pendencias / max) * height);
        const outH = totalH - valH - pendH;
        const baseY = height;

        return (
          <g key={d.label}>
            {outH > 0 && (
              <rect x={x} y={baseY - totalH} width={barWidth} height={outH} fill="#4b5563" rx={2} />
            )}
            {pendH > 0 && (
              <rect x={x} y={baseY - totalH + outH} width={barWidth} height={pendH} fill="#f59e0b" rx={2} />
            )}
            {valH > 0 && (
              <rect x={x} y={baseY - valH} width={barWidth} height={valH} fill="#10b981" rx={2} />
            )}
            <text x={x + barWidth / 2} y={svgHeight - 4} textAnchor="middle" fill="#9ca3af" fontSize={11}>
              {d.label}
            </text>
            <text x={x + barWidth / 2} y={baseY - totalH - 5} textAnchor="middle" fill="#e5e7eb" fontSize={10}>
              {d.validados + d.pendencias + d.outros}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={height} x2={svgWidth} y2={height} stroke="#374151" strokeWidth={1} />
    </svg>
  );
}

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ segments, size = 160 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size * 0.35} fill="none" stroke="#374151" strokeWidth={size * 0.15} />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#6b7280" fontSize={12}>Sem dados</text>
      </svg>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const strokeW = size * 0.15;

  let cumulative = 0;
  const paths = segments.map(seg => {
    const pct = seg.value / total;
    const start = cumulative;
    cumulative += pct;
    return { ...seg, pct, start };
  });

  function describeArc(startPct: number, endPct: number) {
    const startAngle = startPct * 2 * Math.PI - Math.PI / 2;
    const endAngle = endPct * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endPct - startPct > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map(seg => (
        <path
          key={seg.label}
          d={describeArc(seg.start, seg.start + seg.pct)}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeW}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e5e7eb" fontSize={size * 0.12} fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#9ca3af" fontSize={size * 0.08}>
        total
      </text>
    </svg>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 120, color = '#F47920' }: LineChartProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 300;
  const h = height;
  const pad = 20;
  const stepX = (w - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: h - pad - ((d.value / max) * (h - pad * 2)),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          <text x={p.x} y={h - 4} textAnchor="middle" fill="#6b7280" fontSize={9}>{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
}
