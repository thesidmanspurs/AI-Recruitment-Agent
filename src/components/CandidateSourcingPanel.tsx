/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Candidate, SourcingFilters, ActivityLog } from '../types';
import { 
  Briefcase, Filter, ArrowUpRight, CheckCircle, RefreshCw, 
  HelpCircle, Sparkles, MessageSquare, Plus, FileText, Layout,
  Linkedin, Globe, ThumbsUp, ThumbsDown, MessageCirclePlus, Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SourcingPanelProps {
  candidates: Candidate[];
  analyzedSpec: any;
  onUpdateCandidate: (candidate: Candidate) => void;
  onAddLog: (message: string, type: ActivityLog['type']) => void;
  isSourcingLoading: boolean;
  onGenerateRealSourcing: () => void;
}

export default function CandidateSourcingPanel({
  candidates,
  analyzedSpec,
  onUpdateCandidate,
  onAddLog,
  isSourcingLoading,
  onGenerateRealSourcing
}: SourcingPanelProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filters, setFilters] = useState<SourcingFilters>({
    platform: 'all',
    onlyOpenToWork: false,
    minScore: 0
  });

  const [generatingMessageId, setGeneratingMessageId] = useState<string | null>(null);

  // Apply visual platform filters
  const filteredCandidates = candidates.filter(c => {
    const platformMatch = filters.platform === 'all' || c.platform === filters.platform;
    const openToWorkMatch = !filters.onlyOpenToWork || c.openToWork;
    const scoreMatch = (c.matchScore) >= filters.minScore;
    return platformMatch && openToWorkMatch && scoreMatch;
  });

  // Call API to generate customized outreach draft using Gemini on backend
  const handleDraftMessage = async (candidate: Candidate) => {
    setGeneratingMessageId(candidate.id);
    onAddLog(`Drafting a hyper-personalized outreach message for ${candidate.name}...`, 'system');

    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          originalSpec: analyzedSpec?.rawText || "General matching developer position"
        })
      });

      const data = await response.json();
      if (data.success && data.message) {
        const updated = {
          ...candidate,
          outreachMessage: data.message
        };
        onUpdateCandidate(updated);
        if (selectedCandidate?.id === candidate.id) {
          setSelectedCandidate(updated);
        }
        onAddLog(`A personalized outreach draft has been generated for ${candidate.name} using Gemini.`, 'info');
      } else {
        throw new Error(data.error || 'Unknown server drafting error');
      }
    } catch (e: any) {
      console.error(e);
      onAddLog(`Unable to auto-draft message for ${candidate.name}. Relying on internal backup templates.`, 'system');
      // Generate default
      const mockMsg = `Hi ${candidate.name},\n\nI reviewed your portfolio at ${candidate.company} and felt your background in ${candidate.skills.slice(0, 3).join(', ')} aligns tremendously with our core projects. Let's block 10 minutes to discuss details.\n\nBest,`;
      const updated = { ...candidate, outreachMessage: mockMsg };
      onUpdateCandidate(updated);
      if (selectedCandidate?.id === candidate.id) {
        setSelectedCandidate(updated);
      }
    } finally {
      setGeneratingMessageId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            Candidate Sourcing & Screening Board
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Review matching prospects scraped from open communities and social sources. 
            Assess suitability ranks (1-10) calculated by semantic models against your specification parameters.
          </p>
        </div>

        <button
          onClick={onGenerateRealSourcing}
          disabled={!analyzedSpec || isSourcingLoading}
          className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-3 rounded-xl transition duration-150 shadow-sm"
        >
          {isSourcingLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isSourcingLoading ? 'AI Scrapers Searching Open Web...' : 'Initiate Sourcing Engine'}
        </button>
      </div>

      {/* Filter and Content Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Filters Panel Sidebar */}
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
            <Filter className="w-4 h-4 text-slate-600" />
            <h4 className="font-sans font-bold text-slate-900 text-xs">Filter Sourced Pool</h4>
          </div>

          {/* Platform selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wide uppercase text-slate-500 font-bold block">
              Source Origin
            </label>
            <div className="flex flex-col gap-1.5">
              {(['all', 'LinkedIn', 'Upwork', 'Reddit'] as const).map(platform => (
                <button
                  key={platform}
                  onClick={() => setFilters({ ...filters, platform })}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg text-left transition duration-150 ${
                    filters.platform === platform
                      ? 'bg-white text-indigo-600 font-semibold shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {platform === 'all' && <Layout className="w-3.5 h-3.5 text-slate-400" />}
                    {platform === 'LinkedIn' && <Linkedin className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />}
                    {platform === 'Upwork' && <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    {platform === 'Reddit' && <MessageSquare className="w-3.5 h-4 text-rose-500 shrink-0" />}
                    {platform}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    {platform === 'all' 
                      ? candidates.length 
                      : candidates.filter(c => c.platform === platform).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Open to Work */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="onlyOpenToWork"
                className="text-[11px] font-mono tracking-wide uppercase text-slate-500 font-bold cursor-pointer"
              >
                LinkedIn Frame Filtering
              </label>
              <div className="flex items-center">
                <input
                  id="onlyOpenToWork"
                  type="checkbox"
                  checked={filters.onlyOpenToWork}
                  onChange={(e) => setFilters({ ...filters, onlyOpenToWork: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-200 rounded focus:ring-0"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-normal">
              Only fetch profiles possessing the active green emerald <code>#OpenToWork</code> frame tag on their avatar assets.
            </p>
          </div>

          {/* Match Score Range Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-mono tracking-wide uppercase text-slate-500 font-bold block">
                Minimum Match Score
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">{filters.minScore.toFixed(1)} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* Sourced List Container */}
        <div className="lg:col-span-3 space-y-4">
          {filteredCandidates.length === 0 ? (
            <div className="bg-white border rounded-2xl py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-slate-300 mb-2" />
              <h5 className="font-sans font-bold text-sm text-slate-700">No Candidates Match Filters</h5>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
                Try adjusting your sliders or deselecting the active &quot;Open to Work&quot; constraints to unlock deeper databases.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`bg-white border hover:border-slate-350 cursor-pointer rounded-2xl p-4.5 shadow-xs transition duration-150 flex flex-col justify-between ${
                    selectedCandidate?.id === candidate.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Name and matching mark */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar block with visual emerald frame for Open to work */}
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border-2 ${
                            candidate.openToWork ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-indigo-150'
                          }`}>
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {candidate.openToWork && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-[8px] font-semibold text-white px-1 leading-none rounded-full border border-white py-0.5">
                              OPEN
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-slate-900 leading-tight">{candidate.name}</h4>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">
                              {candidate.platform}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">{candidate.company}</p>
                        </div>
                      </div>

                      {/* Suitability score tag */}
                      <div className="text-right">
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.75 rounded ${
                          candidate.matchScore >= 9.5 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          ⭐ {candidate.matchScore.toFixed(1)} / 10
                        </span>
                      </div>
                    </div>

                    {/* Technical Profile Title */}
                    <div>
                      <h5 className="text-xs font-semibold text-slate-800 leading-tight">{candidate.currentTitle}</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">{candidate.bio}</p>
                    </div>

                    {/* Skill Tag list */}
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="text-[9px] bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 4 && (
                        <span className="text-[9px] text-slate-400 self-center pl-1">+{candidate.skills.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  {/* Suitability explanation summary footer */}
                  <div className="pt-3.5 border-t border-slate-100 mt-4 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 truncate max-w-[170px] inline-block font-sans">
                      {candidate.matchExplanation}
                    </span>
                    <span className="text-indigo-600 font-sans font-bold shrink-0 hover:underline inline-flex items-center gap-0.5">
                      Review Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Expanded Candidate Details Modal / Pane */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden text-slate-800 border"
            >
              
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full text-lg font-bold flex items-center justify-center ${
                    selectedCandidate.openToWork ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans font-bold text-base leading-none">{selectedCandidate.name}</h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-medium">
                        {selectedCandidate.platform}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{selectedCandidate.currentTitle} at {selectedCandidate.company}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg p-1.5 text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* Suitability score column */}
                  <div className="md:col-span-1 bg-slate-50 border p-4 rounded-xl text-center space-y-2">
                    <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 uppercase block">
                      Suitability Grade
                    </span>
                    <span className="text-3xl font-sans font-black text-slate-900 block leading-none">
                      {selectedCandidate.matchScore.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10</span>
                    </span>
                    <span className={`inline-block text-[10px] font-sans font-bold px-2 py-0.5 rounded leading-none ${
                      selectedCandidate.matchScore >= 9.5 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {selectedCandidate.matchScore >= 9.5 ? 'Elite Match' : 'Strong Candidate'}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal pt-1.5 border-t">
                      {selectedCandidate.matchExplanation}
                    </p>
                  </div>

                  {/* Strengths & Gaps columns */}
                  <div className="md:col-span-2 space-y-4">
                    {/* Strengths */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-sans font-bold text-slate-900 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        Key Matching Strengths:
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc leading-relaxed">
                        {selectedCandidate.strengths.map((str, index) => (
                          <li key={index}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-sans font-bold text-slate-900 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Identified Gaps:
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc leading-relaxed">
                        {selectedCandidate.gaps.map((gap, index) => (
                          <li key={index}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>

                {/* Technical Skills Array */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900">Endorsed Skills & Technologies:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Multichannel AI Outreach Drafter */}
                <div className="border-t pt-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        AI Automated Campaign Outreach Draft
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">LinkedIn custom message script matched to background.</p>
                    </div>

                    {!selectedCandidate.outreachMessage && (
                      <button
                        onClick={() => handleDraftMessage(selectedCandidate)}
                        disabled={generatingMessageId === selectedCandidate.id}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1 transition-all duration-150"
                      >
                        {generatingMessageId === selectedCandidate.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Generate Custom Message
                      </button>
                    )}
                  </div>

                  {selectedCandidate.outreachMessage ? (
                    <div className="space-y-2">
                      <textarea
                        value={selectedCandidate.outreachMessage}
                        onChange={(e) => {
                          const updated = { ...selectedCandidate, outreachMessage: e.target.value };
                          onUpdateCandidate(updated);
                          setSelectedCandidate(updated);
                        }}
                        rows={6}
                        className="w-full bg-slate-900 text-slate-300 font-mono text-xs p-3.5 rounded-xl border border-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Score: {selectedCandidate.matchScore} &gt; 9.5 automatically triggers priority channel routing.</span>
                        <button
                          onClick={() => handleDraftMessage(selectedCandidate)}
                          className="hover:text-indigo-600 font-semibold"
                        >
                          Regenerate message ⟳
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed rounded-xl p-6 text-center text-slate-400 text-xs font-sans">
                      No outreach message generated. Click <strong>Generate Custom Message</strong> above to use server-side Gemini AI for customized sequences.
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
