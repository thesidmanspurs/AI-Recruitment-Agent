interface Stat {
  label: string;
  value: number;
  color?: 'default' | 'green' | 'blue';
}

function StatCard({ label, value, color = 'default' }: Stat) {
  const valueClass =
    color === 'green'
      ? 'text-emerald-500'
      : color === 'blue'
      ? 'text-blue-500'
      : 'text-gray-900';

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl px-6 py-4">
      <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold tabular-nums ${valueClass}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

interface StatCardsProps {
  identified: number;
  enriched: number;
  outreachSent: number;
}

export function StatCards({ identified, enriched, outreachSent }: StatCardsProps) {
  return (
    <div className="flex gap-4">
      <StatCard label="Identified" value={identified} color="default" />
      <StatCard label="Enriched" value={enriched} color="green" />
      <StatCard label="Outreach Sent" value={outreachSent} color="blue" />
    </div>
  );
}
