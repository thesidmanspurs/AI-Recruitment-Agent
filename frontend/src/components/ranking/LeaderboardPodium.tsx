import type { RankedCandidate } from '../../api/rankingApi';
import { Sparkles } from 'lucide-react';

interface Props {
  topCandidates: RankedCandidate[];
  onSelect: (candidate: RankedCandidate) => void;
}

export function LeaderboardPodium({ topCandidates, onSelect }: Props) {
  if (topCandidates.length === 0) return null;

  const rank1 = topCandidates[0];
  const rank2 = topCandidates[1];
  const rank3 = topCandidates[2];
  const rank4 = topCandidates[3];
  const rank5 = topCandidates[4];

  return (
    <div className="isolate text-gray-900 dark:text-white rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-2xl mb-8 relative overflow-x-auto bg-slate-900">
      {/* User's custom award stage background image backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center rounded-3xl opacity-40 pointer-events-none mix-blend-luminosity"
        style={{ backgroundImage: "url('/award-background.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-950/90 rounded-3xl pointer-events-none" />

      {/* Header with real cup.png icon */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center p-1.5 shadow-md border border-amber-400/30">
            <img src="/cup.png" alt="Trophy Cup" className="w-7 h-7 object-contain animate-blink-glow" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              TOP CANDIDATES WINNERS STAGE <Sparkles size={18} className="text-amber-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Top candidate champions standing on the 5-spot winners stage evaluated against JD criteria
            </p>
          </div>
        </div>
      </div>

      {/* ── 5-CANDIDATE STAGE POSITIONS (Exact User Coordinates Preserved + Floating Bobbing Animation) ── */}
      <div className="relative w-[600px] h-[720px] mx-auto z-10">

        {/* Real enlarged podium.png graphic at bottom center */}
        <img
          src="/podium.png"
          alt="3D Winners Podium Stage"
          className="absolute bottom-0 left-[50px] w-[520px] h-[550px] object-contain drop-shadow-2xl z-0"
        />

        {/* ── Box 1: Rank #1 Gold Champion (Floating Bobbing Animation) ── */}
        {rank1 && (
          <div
            onClick={() => onSelect(rank1)}
            className="absolute top-[10px] left-[233px] w-[150px] z-30 cursor-pointer group flex flex-col items-center animate-float-bob"
          >
            <div className="relative mb-1">
              <div className="absolute -top-5 right-1/2 translate-x-1/2 text-xl animate-pulse">
                👑
              </div>
              <div className="w-14 h-14 rounded-full gold-shimmer-bg p-1 shadow-xl ring-4 ring-amber-400/40">
                <div className="w-full h-full rounded-full bg-amber-950 flex items-center justify-center text-amber-300 font-black text-lg border-2 border-amber-300">
                  {rank1.name.charAt(0)}
                </div>
              </div>
              <img
                src="/cup.png"
                alt="Gold Trophy"
                className="w-8 h-8 object-contain absolute -bottom-2 -right-2 animate-blink-glow drop-shadow-xl"
              />
            </div>

            <div className="bg-white dark:bg-[#181c28] p-2 rounded-2xl border-2 border-amber-400 shadow-xl text-center w-full gold-shimmer-bg">
              <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white uppercase tracking-wider block mb-1 shadow-xs">
                👑 #1 Gold Champion
              </span>
              <h3 className="font-black text-gray-900 dark:text-white text-xs truncate">
                {rank1.name}
              </h3>
              <p className="text-[9.5px] text-amber-700 dark:text-amber-300 font-bold truncate mt-0.5">
                {rank1.currentTitle}
              </p>
              <div className="mt-1 pt-0.5 border-t border-amber-300/50">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {rank1.matchScore.toFixed(1)} / 10
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Box 2: Rank #2 Silver (Floating Bobbing Animation) ── */}
        {rank2 && (
          <div
            onClick={() => onSelect(rank2)}
            className="absolute top-[290px] left-[65px] w-[130px] z-20 cursor-pointer group flex flex-col items-center animate-float-bob-delay-1"
          >
            <div className="relative mb-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-400 via-slate-500 to-zinc-600 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-extrabold text-base border-2 border-slate-300">
                  {rank2.name.charAt(0)}
                </div>
              </div>
              <img
                src="/silver-medal.png"
                alt="Silver Medal"
                className="w-6 h-6 object-contain absolute -bottom-1 -right-1 drop-shadow-md"
              />
            </div>

            <div className="bg-white dark:bg-[#181c28] p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md text-center w-full">
              <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
                🥈 #2 Silver
              </span>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-[11px] truncate">
                {rank2.name}
              </h3>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate font-medium">
                {rank2.currentTitle}
              </p>
              <div className="mt-1 pt-0.5 border-t border-gray-100 dark:border-white/10">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                  {rank2.matchScore.toFixed(1)} / 10
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Box 3: Rank #3 Bronze (Floating Bobbing Animation) ── */}
        {rank3 && (
          <div
            onClick={() => onSelect(rank3)}
            className="absolute top-[340px] left-[425px] w-[130px] z-20 cursor-pointer group flex flex-col items-center animate-float-bob-delay-2"
          >
            <div className="relative mb-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-700 via-orange-700 to-amber-900 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-amber-950 flex items-center justify-center text-orange-200 font-extrabold text-base border-2 border-orange-400">
                  {rank3.name.charAt(0)}
                </div>
              </div>
              <img
                src="/bronze-medal.png"
                alt="Bronze Medal"
                className="w-6 h-6 object-contain absolute -bottom-1 -right-1 drop-shadow-md"
              />
            </div>

            <div className="bg-white dark:bg-[#181c28] p-1.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-md text-center w-full">
              <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-amber-800 text-white uppercase tracking-wider block mb-1">
                🥉 #3 Bronze
              </span>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-[11px] truncate">
                {rank3.name}
              </h3>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate font-medium">
                {rank3.currentTitle}
              </p>
              <div className="mt-1 pt-0.5 border-t border-gray-100 dark:border-white/10">
                <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 tabular-nums">
                  {rank3.matchScore.toFixed(1)} / 10
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Box 5: Rank #5 (Floating Bobbing Animation) ── */}
        {rank5 && (
          <div
            onClick={() => onSelect(rank5)}
            className="absolute top-[520px] left-[-100px] w-[130px] z-10 cursor-pointer group flex flex-col items-center animate-float-bob-delay-1"
          >
            <div className="relative mb-1">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white font-extrabold text-base border border-slate-300">
                  {rank5.name.charAt(0)}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-slate-700 text-white shadow-xs">
                #5
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c28] p-1.5 rounded-xl border border-gray-200 dark:border-white/10 shadow-xs text-center w-full">
              <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-slate-700 text-white uppercase tracking-wider block mb-1">
                🎖️ #5 Finalist
              </span>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-[11px] truncate">
                {rank5.name}
              </h3>
              <p className="text-[9.5px] text-gray-500 dark:text-gray-400 truncate font-medium">
                {rank5.currentTitle}
              </p>
              <div className="mt-1 pt-0.5 border-t border-gray-100 dark:border-white/10">
                <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 tabular-nums">
                  {rank5.matchScore.toFixed(1)} / 10
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Box 4: Rank #4 (Floating Bobbing Animation) ── */}
        {rank4 && (
          <div
            onClick={() => onSelect(rank4)}
            className="absolute top-[450px] right-[-120px] w-[130px] z-10 cursor-pointer group flex flex-col items-center animate-float-bob-delay-2"
          >
            <div className="relative mb-1">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white font-extrabold text-base border border-slate-300">
                  {rank4.name.charAt(0)}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-slate-700 text-white shadow-xs">
                #4
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c28] p-1.5 rounded-xl border border-gray-200 dark:border-white/10 shadow-xs text-center w-full">
              <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-slate-700 text-white uppercase tracking-wider block mb-1">
                🎖️ #4 Finalist
              </span>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-[11px] truncate">
                {rank4.name}
              </h3>
              <p className="text-[9.5px] text-gray-500 dark:text-gray-400 truncate font-medium">
                {rank4.currentTitle}
              </p>
              <div className="mt-1 pt-0.5 border-t border-gray-100 dark:border-white/10">
                <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 tabular-nums">
                  {rank4.matchScore.toFixed(1)} / 10
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
