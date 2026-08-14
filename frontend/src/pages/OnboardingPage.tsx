import { useState } from 'react';
import { Search, Trophy, Sparkles, ArrowRight, CheckCircle2, Shield, Layers } from 'lucide-react';
import type { AuthUser } from '../hooks/useAuth';

interface OnboardingPageProps {
  user: AuthUser;
  onSelectGoal: (goal: 'sourcing' | 'ranking' | 'both') => void;
}

export function OnboardingPage({ user, onSelectGoal }: OnboardingPageProps) {
  const [selected, setSelected] = useState<'sourcing' | 'ranking' | 'both'>('sourcing');

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Subtle background gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 15%, #f1f5f9 0%, #f8fafc 40%, transparent 80%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TalentScanr" className="h-9 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-slate-900">TalentScanr</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Free Exploratory Access</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/70 border border-slate-300 text-slate-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Welcome {user.name ? `, ${user.name}` : ''}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            What is your primary recruitment goal?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Select your preferred workflow to tailor your workspace. You can explore and evaluate the platform freely before purchasing any plan.
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Option 1: Sourcing */}
          <div
            onClick={() => setSelected('sourcing')}
            className={`group cursor-pointer relative p-7 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between ${
              selected === 'sourcing'
                ? 'bg-white border-amber-500 shadow-xl ring-2 ring-amber-500/20 scale-[1.02]'
                : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  selected === 'sourcing' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <Search className="w-6 h-6" />
                </div>
                {selected === 'sourcing' ? (
                  <CheckCircle2 className="w-6 h-6 text-amber-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-300" />
                )}
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700">
                Outbound Sourcing
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Candidate Sourcing
              </h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Autonomously discover and source top passive talent across LinkedIn & GitHub based on your exact job description.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-bold">
              <span>Open Sourcing Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Option 2: Ranking */}
          <div
            onClick={() => setSelected('ranking')}
            className={`group cursor-pointer relative p-7 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between ${
              selected === 'ranking'
                ? 'bg-white border-purple-600 shadow-xl ring-2 ring-purple-600/20 scale-[1.02]'
                : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  selected === 'ranking' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-purple-50 text-purple-600 border border-purple-100'
                }`}>
                  <Trophy className="w-6 h-6" />
                </div>
                {selected === 'ranking' ? (
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-300" />
                )}
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700">
                Inbound Screening
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                CV Batch Ranking
              </h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Upload applicant CV batches (PDF & DOCX) for instantaneous AI evaluation and objective 0–10 fit scoring against your criteria.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-purple-700 font-bold">
              <span>Open Ranking Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Option 3: Both */}
          <div
            onClick={() => setSelected('both')}
            className={`group cursor-pointer relative p-7 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between ${
              selected === 'both'
                ? 'bg-white border-indigo-600 shadow-xl ring-2 ring-indigo-600/20 scale-[1.02]'
                : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  selected === 'both' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}>
                  <Layers className="w-6 h-6" />
                </div>
                {selected === 'both' ? (
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-300" />
                )}
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700">
                Full Recruitment Suite
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Both Features
              </h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Combine the power of outbound passive candidate discovery with automated inbound applicant screening.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-bold">
              <span>Open Full Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="max-w-md mx-auto text-center">
          <button
            type="button"
            onClick={() => onSelectGoal(selected)}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <span>Continue to Workspace</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Free to browse &amp; evaluate · Upgrade only when executing live actions
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center py-4 text-xs text-slate-400 border-t border-slate-200">
        © 2026 TalentScanr AI. All rights reserved.
      </footer>
    </div>
  );
}
