import { useState } from 'react';
import { Search, Trophy, Sparkles, ArrowRight, CheckCircle2, Shield, Rocket } from 'lucide-react';
import type { AuthUser } from '../hooks/useAuth';

interface OnboardingPageProps {
  user: AuthUser;
  onSelectGoal: (goal: 'sourcing' | 'ranking' | 'both') => void;
}

export function OnboardingPage({ user, onSelectGoal }: OnboardingPageProps) {
  const [selected, setSelected] = useState<'sourcing' | 'ranking' | 'both'>('sourcing');

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 50% 30%, #8b5cf6 0%, #3b82f6 30%, transparent 70%)',
      }} />

      {/* Top Header / Brand Logo */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TalentScanr" className="h-9 w-auto" />
          <span className="text-xl font-black tracking-tight text-white">TalentScanr</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-gray-300">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tài khoản dùng thử miễn phí</span>
        </div>
      </header>

      {/* Main Content Card Area */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" /> Chào mừng {user.name || 'bạn'} đến với TalentScanr
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Mục tiêu tuyển dụng chính của bạn là gì?
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-3 leading-relaxed">
            Hãy chọn tính năng bạn muốn sử dụng. Bạn có thể tự do xem & khám phá giao diện hoàn toàn miễn phí.
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Option 1: Sourcing */}
          <div
            onClick={() => setSelected('sourcing')}
            className={`group cursor-pointer relative p-7 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between ${
              selected === 'sourcing'
                ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/5 border-amber-500 shadow-2xl ring-2 ring-amber-500/40 scale-[1.02]'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  selected === 'sourcing' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <Search className="w-6 h-6" />
                </div>
                {selected === 'sourcing' ? (
                  <CheckCircle2 className="w-6 h-6 text-amber-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border border-white/20" />
                )}
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Outbound Sourcing
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Tìm kiếm ứng viên
              </h3>
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                Tự động tìm kiếm ứng viên thụ động trên LinkedIn & GitHub dựa theo yêu cầu tiêu chí JD của bạn.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-amber-300 font-semibold">
              <span>Vào Sourcing Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Option 2: Ranking */}
          <div
            onClick={() => setSelected('ranking')}
            className={`group cursor-pointer relative p-7 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between ${
              selected === 'ranking'
                ? 'bg-gradient-to-b from-purple-500/20 to-purple-600/5 border-purple-500 shadow-2xl ring-2 ring-purple-500/40 scale-[1.02]'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  selected === 'ranking' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  <Trophy className="w-6 h-6" />
                </div>
                {selected === 'ranking' ? (
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border border-white/20" />
                )}
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                Inbound Screening
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Xếp hạng hồ sơ (CV)
              </h3>
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                Tải lên file CVs (PDF/DOCX) hàng loạt và để Gemini AI chấm điểm fit 0–10 lập tức.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-300 font-semibold">
              <span>Vào CV Ranking Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Option 3: Both */}
          <div
            onClick={() => setSelected('both')}
            className={`group cursor-pointer relative p-7 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between ${
              selected === 'both'
                ? 'bg-gradient-to-b from-indigo-500/20 to-indigo-600/5 border-indigo-500 shadow-2xl ring-2 ring-indigo-500/40 scale-[1.02]'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  selected === 'both' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <Rocket className="w-6 h-6" />
                </div>
                {selected === 'both' ? (
                  <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border border-white/20" />
                )}
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Full Recruitment Suite
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Cả hai tính năng
              </h3>
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                Kết hợp sức mạnh vừa tự động tìm kiếm ứng viên thụ động vừa lọc CV ứng tuyển inbound.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300 font-semibold">
              <span>Vào Full Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="max-w-md mx-auto text-center">
          <button
            type="button"
            onClick={() => onSelectGoal(selected)}
            className="w-full py-4 rounded-2xl bg-white text-gray-900 font-black text-base flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-xl hover:shadow-white/10 cursor-pointer"
          >
            <span>Bắt đầu ngay bây giờ</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Xem & trải nghiệm miễn phí · Chỉ nâng cấp gói khi thực sự thao tác
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center py-4 text-xs text-gray-500 border-t border-white/10">
        © 2026 TalentScanr AI. All rights reserved.
      </footer>
    </div>
  );
}
