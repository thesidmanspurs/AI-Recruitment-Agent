interface ScoreBarProps {
  score: number;
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 9.5) return 'bg-green-500';
  if (score >= 8.0) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 9.5) return 'Approved';
  if (score >= 8.0) return 'Borderline';
  return 'Rejected';
}

export function ScoreBar({ score, showLabel = true }: ScoreBarProps) {
  const pct = Math.min(100, (score / 10) * 100);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums text-white w-8 text-right">
        {score.toFixed(1)}
      </span>
      {showLabel && (
        <span className={`text-xs font-medium ${score >= 9.5 ? 'text-green-400' : score >= 8 ? 'text-yellow-400' : 'text-red-400'}`}>
          {label}
        </span>
      )}
    </div>
  );
}
