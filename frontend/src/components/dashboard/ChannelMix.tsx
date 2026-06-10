interface Channel {
  label: string;
  pct: number;
  color: string;
}

interface ChannelMixProps {
  channels: Channel[];
}

export function ChannelMix({ channels }: ChannelMixProps) {
  return (
    <div className="bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <h3 className="text-xs font-bold tracking-widest text-gray-700 dark:text-gray-200 uppercase">Channel Mix</h3>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {channels.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">No channel data yet.</p>
        )}
        {channels.map(channel => (
          <div key={channel.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-700 dark:text-gray-200">{channel.label}</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{channel.pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${channel.color}`}
                style={{ width: `${channel.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
