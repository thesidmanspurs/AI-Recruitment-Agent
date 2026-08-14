import { useState } from 'react';
import { Search, Trophy, Sparkles, ArrowRight, CheckCircle2, Shield, Layers } from 'lucide-react';

interface OnboardingIntentModalProps {
  open: boolean;
  userName?: string;
  onSelectGoal: (goal: 'sourcing' | 'ranking' | 'both') => void;
}

export function OnboardingIntentModal({ open, userName, onSelectGoal }: OnboardingIntentModalProps) {
  const [selected, setSelected] = useState<'sourcing' | 'ranking' | 'both'>('sourcing');

  if (!open) return null;

  const handleConfirm = () => {
    onSelectGoal(selected);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top gradient banner */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Welcome {userName ? `, ${userName}` : ''} to TalentScanr
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              What is your primary recruitment goal?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Select your preferred workflow. You can freely explore the workspace before deciding to upgrade your plan.
            </p>
          </div>

          {/* 3 Goal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {/* Card 1: Sourcing */}
            <div
              onClick={() => setSelected('sourcing')}
              className={`group cursor-pointer relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selected === 'sourcing'
                  ? 'bg-amber-50/70 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selected === 'sourcing' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
                }`}>
                  <Search className="w-4 h-4" />
                </div>
                {selected === 'sourcing' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-700">
                  Sourcing
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Candidate Sourcing
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Autonomously crawl LinkedIn & GitHub for top passive talent matching your JD.
                </p>
              </div>
            </div>

            {/* Card 2: Ranking */}
            <div
              onClick={() => setSelected('ranking')}
              className={`group cursor-pointer relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selected === 'ranking'
                  ? 'bg-purple-50/70 border-purple-600 shadow-md ring-2 ring-purple-600/20'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selected === 'ranking' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  <Trophy className="w-4 h-4" />
                </div>
                {selected === 'ranking' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-700">
                  Ranking
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  CV Batch Ranking
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Upload applicant CV batches (PDF/DOCX) for instantaneous 0–10 AI fit scoring.
                </p>
              </div>
            </div>

            {/* Card 3: Both */}
            <div
              onClick={() => setSelected('both')}
              className={`group cursor-pointer relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selected === 'both'
                  ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selected === 'both' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                {selected === 'both' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-700">
                  Full Suite
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Both Features
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Combine passive talent sourcing with automated inbound applicant CV ranking.
                </p>
              </div>
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Explore the interface freely. Upgrade only when executing live recruitment actions.</span>
            </span>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md cursor-pointer"
          >
            <span>Continue to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
