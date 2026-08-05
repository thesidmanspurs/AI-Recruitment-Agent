import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import {
  Trophy, Plus, Trash2,
  Download, Clock as ClockIcon, CheckCircle2, AlertCircle, Sparkles, UserCheck, ChevronDown, ChevronUp, FileCode, Menu, LogOut, Upload, RefreshCw
} from 'lucide-react';
import { rankingApi, type RankingSession, type RankedCandidate, type UploadResult } from '../api/rankingApi';
import { CVUploadDropzone } from '../components/ranking/CVUploadDropzone';
import { RankedCandidateCard } from '../components/ranking/RankedCandidateCard';
import { QuickAccountSwitcherModal } from '../components/shared/QuickAccountSwitcherModal';
import { FeaturePaywallModal } from '../components/shared/FeaturePaywallModal';
import { WorkspaceSidebar, type RankingSessionDto } from '../components/layout/WorkspaceSidebar';
import { CenterModal } from '../components/shared/CenterModal';
import { CandidateDetailModal } from '../components/ranking/CandidateDetailModal';
import { LeaderboardPodium } from '../components/ranking/LeaderboardPodium';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import type { AuthUser } from '../hooks/useAuth';

type View = 'list' | 'create' | 'results';

interface RankingPageProps {
  user?: AuthUser | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenBilling?: () => void;
  onOpenHome?: () => void;
}

export function RankingPage({ user, onLogout, onOpenAdmin, onOpenBilling, onOpenHome }: RankingPageProps = {}) {
  const [view, setView] = useState<View>('list');
  const [sessions, setSessions] = useState<RankingSession[]>([]);
  const [activeSession, setActiveSession] = useState<RankingSession | null>(null);
  const [results, setResults] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Array<{ filename: string; error: string }>>([]);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<'sourcing' | 'ranking' | null>(null);
  const [showJdDetails, setShowJdDetails] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  // Modal state for incremental CV batch addition
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [addingMore, setAddingMore] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);

  // Modal state for candidate detail view
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  // Form state for creating session with JD criteria
  const [sessionName, setSessionName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [rawJobText, setRawJobText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rankingApi.listSessions();
      setSessions(res.sessions);
      if (res.sessions.length > 0 && !activeSession) {
        const first = await rankingApi.getSession(res.sessions[0].id);
        if (first.session) {
          setActiveSession(first.session);
          setResults(first.session.candidates ?? []);
          setView('results');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleInspectCandidate = (candidate: RankedCandidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !jobTitle.trim() || rawJobText.trim().length < 50) {
      setError('Please fill in all fields. Job description (JD) must be at least 50 characters.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please upload at least one CV file.');
      return;
    }
    setLoading(true);
    setUploading(true);
    setError(null);
    setUploadErrors([]);
    try {
      // 1. Create session with JD criteria
      const sessionRes = await rankingApi.createSession({
        name: sessionName.trim(),
        jobTitle: jobTitle.trim(),
        rawJobText: rawJobText.trim(),
      });
      const session = sessionRes.session;

      // 2. Upload CVs and evaluate against JD criteria
      const uploadRes: UploadResult = await rankingApi.uploadCVs(session.id, selectedFiles);

      const fullSession = { ...session, ...uploadRes.session, rawJobText: rawJobText.trim() };
      setActiveSession(fullSession);
      setSessions(prev => [fullSession, ...prev]);
      setResults(uploadRes.candidates);
      if (uploadRes.errors.length > 0) setUploadErrors(uploadRes.errors);

      // Reset form
      setSessionName('');
      setJobTitle('');
      setRawJobText('');
      setSelectedFiles([]);

      setView('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CVs against JD criteria');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleUploadAdditionalCVs = async () => {
    if (!activeSession || additionalFiles.length === 0) return;
    setAddingMore(true);
    setError(null);
    setUploadErrors([]);
    try {
      const uploadRes: UploadResult = await rankingApi.uploadCVs(activeSession.id, additionalFiles);
      const updatedSession = { ...activeSession, ...uploadRes.session };
      setActiveSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? { ...s, ...updatedSession } : s));
      setResults(uploadRes.candidates);
      if (uploadRes.errors.length > 0) setUploadErrors(uploadRes.errors);
      setAdditionalFiles([]);
      setShowAddMoreModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add additional CVs');
    } finally {
      setAddingMore(false);
    }
  };

  const handleViewSession = async (session: RankingSession) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rankingApi.getSession(session.id);
      setActiveSession(res.session);
      setResults(res.session.candidates ?? []);
      setView('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSessionById = (id: string) => {
    const target = sessions.find(s => s.id === id);
    if (target) handleViewSession(target);
  };

  const handleDeleteSession = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this ranking session and all its candidates?')) return;
    try {
      await rankingApi.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSession?.id === id) {
        setActiveSession(null);
        setResults([]);
        setView('list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleExportCSV = () => {
    if (!results.length) return;
    const headers = ['Rank', 'Medal', 'Name', 'Title', 'Company', 'Location', 'Experience (yrs)', 'Education', 'Score', 'Strengths', 'Gaps', 'Match Explanation', 'Saved', 'File', 'Batch'];
    const rows = results.map(c => [
      c.rankPosition,
      c.medal ?? '',
      c.name,
      c.currentTitle,
      c.company ?? '',
      c.location ?? '',
      c.experienceYears ?? '',
      c.educationLevel ?? '',
      c.matchScore.toFixed(1),
      c.strengths.join(' | '),
      c.gaps.join(' | '),
      `"${c.matchExplanation.replace(/"/g, "'")}"`,
      c.isSaved ? 'YES' : 'no',
      c.originalFileName,
      c.isNewBatch ? 'NEW_BATCH' : 'EXISTING',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-${activeSession?.name ?? 'results'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sidebarSessions: RankingSessionDto[] = sessions.map(s => ({
    id: s.id,
    name: s.name,
    jobTitle: s.jobTitle,
    totalUploaded: s.totalUploaded,
    totalSaved: s.totalSaved,
    status: s.status,
  }));

  const savedCount = results.filter(r => r.isSaved).length;
  const newBatchCount = results.filter(r => r.isNewBatch).length;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0a0c12] text-gray-900 dark:text-gray-100 font-sans transition-colors">
      <QuickAccountSwitcherModal
        open={showSwitchAccount}
        onClose={() => setShowSwitchAccount(false)}
        currentEmail={user?.email}
      />

      <CandidateDetailModal
        open={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        candidate={selectedCandidate}
      />

      {/* Incremental CV Batch Upload Modal */}
      <CenterModal
        open={showAddMoreModal}
        onClose={() => { if (!addingMore) setShowAddMoreModal(false); }}
        title="Add & Rank More CVs"
        subtitle={`Upload additional CV files to combine and re-rank within "${activeSession?.name}"`}
        size="md"
        icon={<Upload className="w-5 h-5 text-gray-900 dark:text-white" />}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              Target Position: {activeSession?.jobTitle}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              New CVs will be evaluated against the active JD criteria and re-ranked together with current candidates. Newly added CVs will feature a <strong className="text-emerald-600 dark:text-emerald-400">✨ NEW BATCH</strong> badge.
            </p>
          </div>

          <CVUploadDropzone
            files={additionalFiles}
            onChange={setAdditionalFiles}
            maxFiles={50}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => setShowAddMoreModal(false)}
              disabled={addingMore}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadAdditionalCVs}
              disabled={addingMore || additionalFiles.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors shadow-xs"
            >
              {addingMore ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Evaluating & Re-ranking…</>
              ) : (
                <><RefreshCw size={14} /> Re-rank Combined Pool</>
              )}
            </button>
          </div>
        </div>
      </CenterModal>

      <FeaturePaywallModal
        open={paywallFeature !== null}
        onClose={() => setPaywallFeature(null)}
        targetFeature={paywallFeature ?? 'sourcing'}
        onUpgrade={() => onOpenBilling?.()}
      />

      {/* Persistent left rail — exact same sidebar as Sourcing mode */}
      <WorkspaceSidebar
        rankingSessions={sidebarSessions}
        activeId={activeSession?.id ?? null}
        onSelect={handleSelectSessionById}
        onNew={() => setView('create')}
        creditBalance={null}
        onOpenBilling={onOpenBilling}
        onOpenRanking={() => {}}
        onOpenSwitchAccount={() => setShowSwitchAccount(true)}
        onLogout={onLogout}
        onPaywallClick={setPaywallFeature}
        user={user ?? undefined}
        onHome={onOpenHome}
        activeCampaignName={activeSession?.name}
        candidateCount={results.length}
        currentMode="ranking"
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />

      {/* Main workspace column matching DashboardPage layout */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c] sticky top-0 z-40 transition-colors">
          <div className="px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNav(true)}
                aria-label="Open menu"
                className="lg:hidden shrink-0 w-9 h-9 -ml-1 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none truncate">
                    {activeSession?.jobTitle ?? 'CV Ranking Workspace'}
                  </h1>
                  <span className="hidden sm:inline text-[10px] bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-mono font-bold px-2 py-0.5 rounded leading-none uppercase">
                    CV Ranking Mode
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {activeSession
                    ? `Session: ${activeSession.name} • ${results.length} CVs evaluated against JD criteria`
                    : 'Upload candidate CV batches and rank them against Job Description criteria'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {view === 'results' && activeSession && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAddMoreModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
                    title="Upload additional CVs into this session and re-rank together"
                  >
                    <Plus size={14} /> Add & Rank More CVs
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-xs font-bold"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </>
              )}

              <button
                onClick={() => setView('create')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-xs font-bold"
              >
                <Plus size={14} /> New Session
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => setShowSwitchAccount(true)}
                  title="Click to switch account"
                  className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate leading-none">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{user.email}</p>
                  </div>
                </button>
              )}

              <ThemeToggle />

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="px-6 py-6 space-y-6">
          {/* Error banner */}
          {error && (
            <div className="p-4 rounded-xl flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Upload errors */}
          {uploadErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
              <p className="text-xs font-bold mb-1">⚠️ {uploadErrors.length} file(s) could not be processed:</p>
              {uploadErrors.map((e, i) => (
                <p key={i} className="text-[11px]">• {e.filename}: {e.error}</p>
              ))}
            </div>
          )}

          {/* ── 1. LIST VIEW ── */}
          {view === 'list' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Ranking Sessions Overview</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select a session from the sidebar or grid below to review candidate evaluations</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-t-white animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#10131c] rounded-2xl border border-gray-200 dark:border-white/10 p-8 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4">
                    <Trophy size={28} className="text-gray-700 dark:text-gray-300" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No ranking sessions created yet</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                    Create a session, enter your Job Description (JD) criteria, and upload candidate CV files to evaluate fit.
                  </p>
                  <button
                    onClick={() => setView('create')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-xs"
                  >
                    <Plus size={16} /> Start New Ranking Session
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleViewSession(session)}
                      className="group cursor-pointer rounded-2xl p-5 bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 shadow-xs transition-all hover:border-gray-400 dark:hover:border-white/20 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{session.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium">{session.jobTitle}</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        {session.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            <CheckCircle2 size={10} /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            <ClockIcon size={10} /> Processing
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-xl p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <p className="text-base font-extrabold text-gray-900 dark:text-white tabular-nums">{session.totalUploaded}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Uploaded</p>
                        </div>
                        <div className="rounded-xl p-2.5 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                          <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">{session.totalSaved}</p>
                          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-bold uppercase tracking-wider">Top 50% Saved</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 font-mono">
                        {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── 2. CREATE VIEW (JD Criteria Setup) ── */}
          {view === 'create' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-[#10131c] rounded-2xl p-8 border border-gray-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-bold shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Configure Job Criteria & Upload CVs</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gemini will evaluate each candidate CV against this exact Job Description</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Target Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Session Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sessionName}
                        onChange={e => setSessionName(e.target.value)}
                        placeholder="e.g. Backend Engineers — Batch Q3"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Job Description Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Job Description (JD) & Key Evaluation Criteria <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400 font-mono">{rawJobText.length} chars (min 50)</span>
                    </div>
                    <textarea
                      value={rawJobText}
                      onChange={e => setRawJobText(e.target.value)}
                      placeholder="Paste the full job description, required technical skills, experience requirements, and key responsibilities here..."
                      rows={8}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Upload Candidate CV Files
                    </label>
                    <CVUploadDropzone
                      files={selectedFiles}
                      onChange={setSelectedFiles}
                      maxFiles={50}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => { setView('list'); setError(null); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    disabled={loading || uploading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {uploading ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-white dark:border-t-gray-900 animate-spin" /> Evaluating CVs against JD…</>
                    ) : (
                      <><Trophy size={16} /> Rank Candidates Against JD</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. RESULTS VIEW (Leaderboard Concept) ── */}
          {view === 'results' && (
            <div className="space-y-6">
              {/* Active JD Summary Card */}
              <div className="bg-white dark:bg-[#10131c] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowJdDetails(!showJdDetails)}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode size={18} className="text-gray-700 dark:text-gray-300 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        Evaluation Criteria: {activeSession?.jobTitle}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        Session: {activeSession?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAddMoreModal(true); }}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Plus size={13} /> Add More CVs
                    </button>
                    <button type="button" className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      {showJdDetails ? <><ChevronUp size={14} /> Hide JD</> : <><ChevronDown size={14} /> View Active JD Criteria</>}
                    </button>
                  </div>
                </div>

                {showJdDetails && activeSession?.rawJobText && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Job Description Text</p>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {activeSession.rawJobText}
                    </div>
                  </div>
                )}
              </div>

              {/* Top 5 Winners Stage Showcase Card */}
              {results.length > 0 && (
                <LeaderboardPodium
                  topCandidates={results.slice(0, 5)}
                  onSelect={handleInspectCandidate}
                />
              )}

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#10131c] rounded-2xl p-5 border border-gray-200 dark:border-white/10 text-center shadow-xs">
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">{results.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                    CVs Evaluated {newBatchCount > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-bold">({newBatchCount} new)</span>}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#10131c] rounded-2xl p-5 border border-gray-200 dark:border-white/10 text-center shadow-xs">
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {results[0] ? `${results[0].matchScore.toFixed(1)}/10` : '—'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Highest Match Score</p>
                </div>
              </div>

              {/* Leaderboard Table / Rows */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                  Full Candidate Leaderboard Ranking (Click row to inspect full profile)
                </h3>
                <div className="space-y-3">
                  {results.slice(0, displayLimit).map(candidate => (
                    <RankedCandidateCard
                      key={`${candidate.rankPosition}-${candidate.originalFileName}`}
                      candidate={candidate}
                      onSelect={handleInspectCandidate}
                    />
                  ))}
                </div>
              </div>

              {/* View More Pagination Button */}
              {results.length > displayLimit && (
                <div className="flex flex-col items-center justify-center pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setDisplayLimit(prev => prev + 10)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all shadow-xs"
                  >
                    <span>View More Candidates ({results.length - displayLimit} remaining)</span>
                    <ChevronDown size={14} />
                  </button>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-mono">
                    Showing {Math.min(displayLimit, results.length)} of {results.length} evaluated candidates
                  </p>
                </div>
              )}

              {results.length === 0 && (
                <div className="text-center py-16 text-xs text-gray-500 dark:text-gray-400">
                  No candidates evaluated yet. Upload CV files to start ranking.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
