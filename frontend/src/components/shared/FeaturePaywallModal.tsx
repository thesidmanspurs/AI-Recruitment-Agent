import { useEffect, useRef } from 'react';
import type { MouseEvent, KeyboardEvent as KBEvent } from 'react';
import {
  Rocket, Trophy, Clock, X, Check, ArrowRight,
  Frown, Sparkles, ShieldCheck, Zap
} from 'lucide-react';

/* ─── Inject CSS keyframes once ──────────────────────────────────────── */
const KEYFRAME_ID = 'paywall-keyframes';
function injectKeyframes() {
  if (typeof document === 'undefined' || document.getElementById(KEYFRAME_ID)) return;
  const s = document.createElement('style');
  s.id = KEYFRAME_ID;
  s.textContent = `
    @keyframes paywall-ping {
      0%   { transform: scale(1);   opacity: 0.20; }
      70%  { transform: scale(1.7); opacity: 0;    }
      100% { transform: scale(1.7); opacity: 0;    }
    }
    @keyframes paywall-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes paywall-float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-5px); }
    }
    @keyframes paywall-glow-orange {
      0%, 100% { box-shadow: 0 0 18px 3px rgba(249,115,22,0.4); }
      50%       { box-shadow: 0 0 36px 8px rgba(249,115,22,0.65); }
    }
    @keyframes paywall-glow-purple {
      0%, 100% { box-shadow: 0 0 18px 3px rgba(139,92,246,0.4); }
      50%       { box-shadow: 0 0 36px 8px rgba(139,92,246,0.65); }
    }
    @keyframes paywall-bounce-x {
      0%, 100% { transform: translateX(0); }
      50%       { transform: translateX(3px); }
    }
  `;
  document.head.appendChild(s);
}

/* ─── Animated pulsing orb wrapper ───────────────────────────────────── */
function AnimatedOrb({ isSourcing }: { isSourcing: boolean }) {
  const color = isSourcing ? '#f97316' : '#8b5cf6';
  const grad = isSourcing
    ? 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)'
    : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      {/* pulse ring */}
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.18,
        animation: 'paywall-ping 2.2s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      {/* circle */}
      <span style={{
        position: 'absolute', inset: 5, borderRadius: '50%', background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'paywall-float 3.5s ease-in-out infinite',
      }}>
        {isSourcing
          ? <Rocket size={22} color="#fff" />
          : <Trophy size={22} color="#fff" />
        }
      </span>
    </div>
  );
}

/* ─── Small stat pill ────────────────────────────────────────────────── */
function StatPill({ value, label, isSourcing }: { value: string; label: string; isSourcing: boolean }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 10px', borderRadius: 12,
      background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)',
    }}>
      <span style={{
        fontSize: 18, fontWeight: 900, lineHeight: 1,
        background: isSourcing
          ? 'linear-gradient(90deg,#f97316,#fbbf24)'
          : 'linear-gradient(90deg,#8b5cf6,#6366f1)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{value}</span>
      <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{label}</span>
    </div>
  );
}

/* ─── Feature row ────────────────────────────────────────────────────── */
function FeatureRow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{
        flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
        background: 'rgba(16,185,129,0.12)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginTop: 1,
      }}>
        <Check size={11} color="#10b981" />
      </span>
      <span style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.5 }}>{label}</span>
    </div>
  );
}

/* ─── Main modal component ───────────────────────────────────────────── */
interface FeaturePaywallModalProps {
  open: boolean;
  onClose: () => void;
  targetFeature: 'sourcing' | 'ranking';
  onUpgrade: () => void;
}

export function FeaturePaywallModal({
  open, onClose, targetFeature, onUpgrade,
}: FeaturePaywallModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isSourcing = targetFeature === 'sourcing';

  useEffect(() => {
    if (!open) return;
    injectKeyframes();
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
  };

  const sourcingFeatures = [
    'Multi-Channel Sourcing — LinkedIn, GitHub & Apollo',
    'Verified Email & Direct Phone Number Enrichment',
    'Gemini AI Persona Match Score & Fit Justification',
    '1-Click Personalized Outreach Draft Generator',
  ];
  const rankingFeatures = [
    'Batch Upload up to 50 CVs (PDF & DOCX) at once',
    'AI Skills, Experience & Gap Extraction per CV',
    'Interactive 3D Leaderboard Podium for Top 5',
    '1-Click Full CSV Export for Hiring Managers',
  ];
  const features = isSourcing ? sourcingFeatures : rankingFeatures;

  const accentColor = isSourcing ? '#f97316' : '#8b5cf6';
  const grad = isSourcing
    ? 'linear-gradient(110deg, #f97316 0%, #fb923c 40%, #fbbf24 100%)'
    : 'linear-gradient(110deg, #7c3aed 0%, #8b5cf6 50%, #6366f1 100%)';
  const glowAnim = isSourcing ? 'paywall-glow-orange' : 'paywall-glow-purple';

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%', maxWidth: 500,
          borderRadius: 24,
          background: 'linear-gradient(170deg, #ffffff 0%, #f9fafb 100%)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Top shimmer bar ── */}
        <div style={{
          height: 4, background: grad,
          backgroundSize: '200% auto',
          animation: 'paywall-shimmer 3s linear infinite',
        }} />

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '20px 22px 12px' }}>
          <AnimatedOrb isSourcing={isSourcing} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: '#111827', lineHeight: 1.3 }}>
              {isSourcing ? 'Unlock AI Sourcing Engine' : 'Unlock AI CV Ranking'}
            </h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0', lineHeight: 1.5 }}>
              {isSourcing
                ? 'Auto-hunt, enrich & outreach the top 1% passive tech talent in seconds'
                : 'Rank 50+ CVs with AI instantly. Crown your top champions on a 3D stage.'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={16} color="#9ca3af" />
          </button>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: 8, padding: '0 22px 14px' }}>
          {isSourcing ? (
            <>
              <StatPill value="5s" label="Scan time" isSourcing />
              <StatPill value="4.5×" label="Reply rate" isSourcing />
              <StatPill value="3+" label="Platforms" isSourcing />
            </>
          ) : (
            <>
              <StatPill value="50" label="CVs / run" isSourcing={false} />
              <StatPill value="10s" label="Ranked" isSourcing={false} />
              <StatPill value="3D" label="Podium" isSourcing={false} />
            </>
          )}
        </div>

        {/* ── Pain vs Gain ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 22px 14px' }}>
          {/* Pain */}
          <div style={{
            padding: '12px 13px', borderRadius: 16,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <Frown size={14} color="#ef4444" />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Without This
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.55, margin: 0 }}>
              {isSourcing
                ? <>⏳ <strong style={{ color: '#374151' }}>25+ hrs/week</strong> copy-pasting. <strong style={{ color: '#374151' }}>0% contact rate.</strong> No email, no phone.</>
                : <>😩 Drowning in <strong style={{ color: '#374151' }}>500+ PDF CVs.</strong> Weekends lost. Biased & exhausted hiring.</>
              }
            </p>
          </div>

          {/* Gain */}
          <div style={{
            padding: '12px 13px', borderRadius: 16,
            background: isSourcing
              ? 'linear-gradient(135deg,rgba(249,115,22,0.07),rgba(251,191,36,0.07))'
              : 'linear-gradient(135deg,rgba(139,92,246,0.07),rgba(99,102,241,0.07))',
            border: `1px solid ${isSourcing ? 'rgba(249,115,22,0.25)' : 'rgba(139,92,246,0.25)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <Zap size={15} color={accentColor} />
              <span style={{ fontSize: 10, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                With This
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.55, margin: 0 }}>
              {isSourcing
                ? <>⚡ Scan LinkedIn + GitHub + Apollo in <strong style={{ color: '#374151' }}>5 seconds.</strong> Verified emails, <strong style={{ color: '#374151' }}>4.5× response rate.</strong></>
                : <>🏆 <strong style={{ color: '#374151' }}>50 CVs ranked</strong> in 10 seconds. AI scores every skill. <strong style={{ color: '#374151' }}>3D Winners Stage.</strong></>
              }
            </p>
          </div>
        </div>

        {/* ── Feature list ── */}
        <div style={{
          margin: '0 22px 14px',
          padding: '13px 14px',
          borderRadius: 16,
          background: 'rgba(0,0,0,0.025)',
          border: '1px solid rgba(0,0,0,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Sparkles size={14} color="#f59e0b" />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Everything Included
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 10px' }}>
            {features.map((f, i) => (
              <span key={i} style={{ display: 'contents' }}>
                <FeatureRow label={f} />
              </span>
            ))}
          </div>
        </div>

        {/* ── Trust badge ── */}
        <div style={{ padding: '0 22px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={13} color="#10b981" />
          <span style={{ fontSize: 10, color: '#9ca3af' }}>
            Cancel anytime · No contracts · SOC 2 compliant · 14-day money-back
          </span>
        </div>

        {/* ── CTA Buttons ── */}
        <div style={{ display: 'flex', gap: 10, padding: '0 22px 20px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.09)',
              fontSize: 12, fontWeight: 600, color: '#6b7280',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={() => { onClose(); onUpgrade(); }}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 12,
              background: grad, backgroundSize: '200% auto',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: '0.04em',
              textTransform: 'uppercase',
              animation: `paywall-shimmer 3s linear infinite, ${glowAnim} 2.5s ease-in-out infinite`,
            }}
          >
            {isSourcing
              ? <Rocket size={16} color="#fff" />
              : <Trophy size={16} color="#fff" />
            }
            <span>Unlock {isSourcing ? 'Sourcing — $159/mo' : 'CV Ranking — $109/mo'}</span>
            <span style={{ animation: 'paywall-bounce-x 1.2s ease-in-out infinite' }}>
              <ArrowRight size={15} color="#fff" />
            </span>
          </button>
        </div>

        {/* ── Bottom social proof strip ── */}
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(0,0,0,0.02)',
          padding: '10px 22px',
          display: 'flex', justifyContent: 'center', gap: 22,
        }}>
          {[
            { icon: <Clock size={13} color="#f59e0b" />, text: 'Setup in 2 min' },
            { icon: <Zap size={13} color="#3b82f6" />, text: 'Instant activation' },
            { icon: <ShieldCheck size={13} color="#10b981" />, text: 'No contracts' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {icon}
              <span style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
