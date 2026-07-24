/* ─── Bar chart: stacked (by-turno) ─── */
interface BarChartProps {
  data: { label: string; validados: number; pendencias: number; outros: number }[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  const max = Math.max(...data.map(d => d.validados + d.pendencias + d.outros), 1);
  const barWidth = 48;
  const gap = 28;
  const leftPad = 30;
  const svgWidth = leftPad + data.length * (barWidth + gap) + gap;
  const svgHeight = height + 40;

  const gridVals = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
      {gridVals.map(p => {
        const y = Math.round(height - p * height);
        return (
          <g key={p}>
            <line x1={leftPad} y1={y} x2={svgWidth} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={leftPad - 4} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize={9}>{Math.round(p * max * 10) / 10}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = leftPad + gap + i * (barWidth + gap);
        const totalH = Math.round(((d.validados + d.pendencias + d.outros) / max) * height);
        const valH = Math.round((d.validados / max) * height);
        const pendH = Math.round((d.pendencias / max) * height);
        const outH = totalH - valH - pendH;
        const baseY = height;
        return (
          <g key={d.label}>
            {outH > 0 && <rect x={x} y={baseY - totalH} width={barWidth} height={outH} fill="#94a3b8" rx={2} />}
            {pendH > 0 && <rect x={x} y={baseY - totalH + outH} width={barWidth} height={pendH} fill="#f59e0b" rx={2} />}
            {valH > 0 && <rect x={x} y={baseY - valH} width={barWidth} height={valH} fill="#10b981" rx={2} />}
            <text x={x + barWidth / 2} y={svgHeight - 4} textAnchor="middle" fill="#6b7280" fontSize={11}>{d.label}</text>
            <text x={x + barWidth / 2} y={baseY - totalH - 5} textAnchor="middle" fill="#374151" fontSize={10} fontWeight="600">
              {d.validados + d.pendencias + d.outros}
            </text>
          </g>
        );
      })}
      <line x1={leftPad} y1={height} x2={svgWidth} y2={height} stroke="#e5e7eb" strokeWidth={1} />
    </svg>
  );
}

/* ─── Productivity bar chart: grouped per atendente ─── */
interface ProductivityBarChartProps {
  data: { name: string; cadastros: number; checklists: number }[];
  height?: number;
}

export function ProductivityBarChart({ data, height = 200 }: ProductivityBarChartProps) {
  const max = Math.max(...data.map(d => Math.max(d.cadastros, d.checklists)), 1);
  const barW = 18;
  const innerGap = 5;
  const groupGap = 22;
  const groupW = barW * 2 + innerGap;
  const leftPad = 28;
  const svgW = leftPad + data.length * (groupW + groupGap) + 10;
  const svgH = height + 44;
  const gridVals = [0, 0.5, 1];

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
      {gridVals.map(p => {
        const y = Math.round(height - p * height);
        return (
          <g key={p}>
            <line x1={leftPad} y1={y} x2={svgW} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={leftPad - 4} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize={9}>{Math.round(p * max)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = leftPad + i * (groupW + groupGap);
        const cadH = Math.max(Math.round((d.cadastros / max) * height), d.cadastros > 0 ? 2 : 0);
        const chkH = Math.max(Math.round((d.checklists / max) * height), d.checklists > 0 ? 2 : 0);
        const firstName = d.name.split(' ')[0];
        return (
          <g key={d.name}>
            <rect x={x} y={height - cadH} width={barW} height={cadH} fill="#F47920" rx={2} />
            <rect x={x + barW + innerGap} y={height - chkH} width={barW} height={chkH} fill="#334155" rx={2} />
            <text x={x + groupW / 2} y={height + 14} textAnchor="middle" fill="#6b7280" fontSize={9}>{firstName}</text>
            {d.cadastros > 0 && (
              <text x={x + barW / 2} y={height - cadH - 3} textAnchor="middle" fill="#F47920" fontSize={8}>{d.cadastros}</text>
            )}
            {d.checklists > 0 && (
              <text x={x + barW + innerGap + barW / 2} y={height - chkH - 3} textAnchor="middle" fill="#334155" fontSize={8}>{d.checklists}</text>
            )}
          </g>
        );
      })}
      <line x1={leftPad} y1={height} x2={svgW} y2={height} stroke="#e5e7eb" strokeWidth={1} />
    </svg>
  );
}

/* ─── Donut chart ─── */
interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ segments, size = 200 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32;
  const strokeW = size * 0.14;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeW} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill="#9ca3af" fontSize={12}>Sem dados</text>
      </svg>
    );
  }

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

  const labelR = r + strokeW * 0.5 + 18;

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
        />
      ))}
      {/* External labels */}
      {paths.filter(seg => seg.pct > 0.05).map(seg => {
        const midAngle = (seg.start + seg.pct / 2) * 2 * Math.PI - Math.PI / 2;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);
        const anchor = lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle';
        const pct = Math.round(seg.pct * 100);
        return (
          <g key={seg.label}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fill={seg.color} fontSize={size * 0.065} fontWeight="600">{seg.label}</text>
            <text x={lx} y={ly + size * 0.075} textAnchor={anchor} fill="#6b7280" fontSize={size * 0.058}>{pct}%</text>
          </g>
        );
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#0f1923" fontSize={size * 0.13} fontWeight="bold">{total}</text>
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill="#9ca3af" fontSize={size * 0.07}>total</text>
    </svg>
  );
}

/* ─── Line chart ─── */
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
    y: h - pad - (d.value / max) * (h - pad * 2),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          <text x={p.x} y={h - 4} textAnchor="middle" fill="#9ca3af" fontSize={9}>{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
}
