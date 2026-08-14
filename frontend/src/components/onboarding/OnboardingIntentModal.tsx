import { useState } from 'react';
import { Search, Trophy, Sparkles, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#10131c] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Top gradient banner */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Chào mừng {userName ? userName : 'bạn'} đến với TalentScanr
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Mục tiêu tuyển dụng của bạn là gì?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Chọn tính năng chính bạn muốn trải nghiệm. Bạn có thể tự do khám phá giao diện trước khi quyết định nâng cấp gói.
            </p>
          </div>

          {/* 3 Goal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {/* Card 1: Sourcing */}
            <div
              onClick={() => setSelected('sourcing')}
              className={`group cursor-pointer relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selected === 'sourcing'
                  ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                  : 'bg-gray-50/60 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selected === 'sourcing' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  <Search className="w-4 h-4" />
                </div>
                {selected === 'sourcing' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Sourcing
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  Tìm kiếm ứng viên
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Autonomously crawl LinkedIn & GitHub tìm ứng viên thụ động theo JD.
                </p>
              </div>
            </div>

            {/* Card 2: Ranking */}
            <div
              onClick={() => setSelected('ranking')}
              className={`group cursor-pointer relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selected === 'ranking'
                  ? 'bg-purple-50/70 dark:bg-purple-500/10 border-purple-500 shadow-md ring-2 ring-purple-500/30'
                  : 'bg-gray-50/60 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selected === 'ranking' ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                }`}>
                  <Trophy className="w-4 h-4" />
                </div>
                {selected === 'ranking' && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Ranking
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  Xếp hạng hồ sơ
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Upload hàng loạt CVs (PDF/DOCX) & chấm điểm AI 0–10 theo JD.
                </p>
              </div>
            </div>

            {/* Card 3: Both */}
            <div
              onClick={() => setSelected('both')}
              className={`group cursor-pointer relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selected === 'both'
                  ? 'bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-gray-50/60 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selected === 'both' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                {selected === 'both' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Full Suite
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  Cả hai tính năng
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Kết hợp cả Sourcing thụ động lẫn Xếp hạng hồ sơ ứng tuyển inbound.
                </p>
              </div>
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Khám phá giao diện hoàn toàn miễn phí. Chỉ nâng cấp gói khi thực hiện thao tác.</span>
            </span>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md cursor-pointer"
          >
            <span>Bắt đầu trải nghiệm</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
