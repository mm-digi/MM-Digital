export default function Sparkline({
  values,
  label,
}: {
  values: number[];
  label: string;
}) {
  const width = 520;
  const height = 140;
  const max = Math.max(...values, 1);
  const min = 0;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const area = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl">{label}</h3>
        <span className="text-xs text-white/50">Last 30 days</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label={label}>
        <polygon points={area} fill="rgba(255,128,139,0.18)" />
        <polyline points={points.join(" ")} fill="none" stroke="#ff808b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}
