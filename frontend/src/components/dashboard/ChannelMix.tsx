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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold tracking-widest text-gray-700 uppercase">Channel Mix</h3>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {channels.length === 0 && (
          <p className="text-xs text-gray-400">No channel data yet.</p>
        )}
        {channels.map(channel => (
          <div key={channel.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-700">{channel.label}</span>
              <span className="text-xs font-bold text-gray-900 tabular-nums">{channel.pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
