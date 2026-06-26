/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Candidate, OutreachStatus, ActivityLog } from '../types';
import { 
  Send, Mail, Phone, Clock, AlertTriangle, 
  CheckCircle, MessageSquare, ArrowRight, UserCheck, 
  HelpCircle, Sparkles, Smartphone, CheckSquare, RefreshCcw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CampaignTrackerProps {
  candidates: Candidate[];
  onUpdateCandidate: (candidate: Candidate) => void;
  onAddLog: (message: string, type: ActivityLog['type']) => void;
}

export default function OutreachCampaignTracker({ 
  candidates, 
  onUpdateCandidate, 
  onAddLog 
}: CampaignTrackerProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [takeoverNotes, setTakeoverNotes] = useState<string>('');
  const [isSimulatingTimeline, setIsSimulatingTimeline] = useState<boolean>(false);

  // Group candidates by status
  const pipelineColumns: { status: OutreachStatus; title: string; color: string; bg: string }[] = [
    { status: 'Sourced', title: 'Sourced snap', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    { status: 'Enriched', title: 'Enriched base', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
    { status: 'Outreach Sent', title: 'Outreach Sent', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { status: 'Opened', title: 'Opened/Read', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-indigo-50 border-gray-200 dark:border-gray-700' },
    { status: 'Replied', title: 'Replied', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { status: 'No Response', title: 'No Response (Alert)', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
  ];

  // Helper to filter candidates relative to status
  const getCandidatesByStatus = (status: OutreachStatus) => {
    return candidates.filter(c => c.outreachStatus === status);
  };

  // Trigger campaign message sending
  const handleStartCampaign = (candidate: Candidate) => {
    if (!candidate.outreachMessage) {
      onAddLog(`Failed to start campaign for ${candidate.name}: No personalized message drafted yet.`, 'system');
      return;
    }

    const updated = {
      ...candidate,
      outreachStatus: 'Outreach Sent' as OutreachStatus,
      daysSinceOutreach: 0
    };
    onUpdateCandidate(updated);
    if (selectedCandidate?.id === candidate.id) {
      setSelectedCandidate(updated);
    }
    onAddLog(`Campaign triggered for ${candidate.name}. LinkedIn message & Outreach email dispatched successfully.`, 'outreach');
  };

  const handleBulkStartCampaign = () => {
    const enriched = candidates.filter(c => c.outreachStatus === 'Enriched');
    if (enriched.length === 0) {
      onAddLog('No enriched candidates ready to launch campaign outreach.', 'system');
      return;
    }

    enriched.forEach(candidate => {
      // If no custom message exists, generate a quick fallback
      const updated = {
        ...candidate,
        outreachStatus: 'Outreach Sent' as OutreachStatus,
        daysSinceOutreach: 0,
        outreachMessage: candidate.outreachMessage || `Hi ${candidate.name}, I reviewed your credentials at ${candidate.company} and would love to chat regarding matching projects.`
      };
      onUpdateCandidate(updated);
    });
    
    onAddLog(`Bulk outreach launched! Successfully sent custom messaging tracks to ${enriched.length} candidates.`, 'outreach');
  };

  // Simulate progress of 2 calendar days to trigger alerts
  const handleSimulateTimelineProgress = () => {
    setIsSimulatingTimeline(true);
    setTimeout(() => {
      candidates.forEach(candidate => {
        if (candidate.outreachStatus === 'Outreach Sent') {
          // Diverse responsive events:
          // Marcus Vance (SAP CPI) has a high score and replies proactively in the simulator
          if (candidate.name.includes('Marcus') || candidate.name.includes('Elena') || Math.random() > 0.6) {
            const updated = {
              ...candidate,
              outreachStatus: 'Replied' as OutreachStatus,
              daysSinceOutreach: 2
            };
            onUpdateCandidate(updated);
            onAddLog(`Candidate ${candidate.name} has responded! "Thanks for reaching out, I am highly interested in discussing further."`, 'reply');
          } else {
            // Clara Zhang/others might not reply immediately - triggers alert
            const updated = {
              ...candidate,
              outreachStatus: 'No Response' as OutreachStatus,
              daysSinceOutreach: 2,
              alertTriggered: true
            };
            onUpdateCandidate(updated);
            onAddLog(`Smart Alert: Candidate ${candidate.name} has not responded to outreach in 48 hours. Human intervention needed.`, 'alert');
          }
        }
      });
      setIsSimulatingTimeline(false);
      onAddLog('Simulated timeline advanced by 48 hours. System alerted all inactive outreaches.', 'info');
    }, 1200);
  };

  const handleResetStatusesByForce = () => {
    candidates.forEach(c => {
      const updated = {
        ...c,
        outreachStatus: 'Sourced' as OutreachStatus,
        daysSinceOutreach: 0,
        alertTriggered: false
      };
      onUpdateCandidate(updated);
    });
    setSelectedCandidate(null);
    onAddLog('Campaign dashboard reset successfully. Sourced status active.', 'info');
  };

  const handleSaveTakeoverNotes = (candidate: Candidate) => {
    const updated = {
      ...candidate,
      notes: takeoverNotes,
      alertTriggered: false // Turn off alert after manual takeover notes saved
    };
    onUpdateCandidate(updated);
    setSelectedCandidate(updated);
    setTakeoverNotes('');
    onAddLog(`Saved manual recruiter action logs for ${candidate.name}. Status updated.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls Top-bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="font-sans font-semibold text-sm">Interactive Campaign Outreach Sandbox</h3>
          </div>
          <p className="text-xs text-slate-300">
            Automate multiline tracking. Simulate a 2-day timeline warp to trigger the response alerts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleBulkStartCampaign}
            disabled={candidates.filter(c => c.outreachStatus === 'Enriched').length === 0}
            className="flex items-center gap-1.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2.5 rounded-xl transition duration-150"
          >
            <Send className="w-3.5 h-3.5" />
            Bulk Outreach Launch
          </button>

          <button
            onClick={handleSimulateTimelineProgress}
            disabled={candidates.filter(c => c.outreachStatus === 'Outreach Sent').length === 0 || isSimulatingTimeline}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2.5 rounded-xl transition duration-150"
          >
            {isSimulatingTimeline ? (
              <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            Elapse 48 Hours (Simulate Days)
          </button>

          <button
            onClick={handleResetStatusesByForce}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium px-3 py-2.5 rounded-xl transition duration-150"
          >
            Reset Loop
          </button>
        </div>
      </div>

      {/* Alert Banner for Triggered Alerts */}
      {candidates.some(c => c.alertTriggered) && (
        <div className="bg-rose-50 border border-rose-100/80 rounded-2xl p-4 flex items-start gap-3 text-rose-900 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-rose-900">Urgent: Stale Outreach Alarms Active</h4>
            <p className="text-xs text-rose-700 leading-relaxed">
              One or more highly ranked candidates crossed our 48-hour unanswered threshold without replying.
              Click on these matching candidate profiles inside the <strong>No Response (Alert)</strong> pipeline lists to obtain corporate phone enrichments and perform manual recruiter phone calls.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Kanban Board Columns - Taking 3/4 widths on desktop */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {pipelineColumns.map(column => {
              const scopedCandidates = getCandidatesByStatus(column.status);
              return (
                <div 
                  key={column.status} 
                  className={`flex flex-col rounded-xl p-3 border ${column.bg} min-h-[220px] transition-all duration-200`}
                >
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <span className="text-[11px] font-sans font-semibold tracking-wide uppercase text-slate-500">
                      {column.title}
                    </span>
                    <span className={`text-xs font-mono font-bold ${column.color}`}>
                      {scopedCandidates.length}
                    </span>
                  </div>

                  {/* Inside Cards items */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[400px]">
                    {scopedCandidates.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-mono text-center p-4">
                        Empty column
                      </div>
                    ) : (
                      scopedCandidates.map(candidate => (
                        <motion.div
                          layoutId={`kanban-${candidate.id}`}
                          key={candidate.id}
                          onClick={() => setSelectedCandidate(candidate)}
                          className={`bg-white hover:border-slate-300 cursor-pointer rounded-lg p-3 border shadow-xs transition duration-150 ${
                            selectedCandidate?.id === candidate.id ? 'ring-2 ring-indigo-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            {/* Avatar or Title shortener */}
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                              {candidate.platform}
                            </span>
                            <span className="text-[10px] text-gray-700 dark:text-gray-300 font-sans font-bold flex items-center gap-0.5">
                              ⭐ {candidate.matchScore.toFixed(1)}
                            </span>
                          </div>

                          <h4 className="font-semibold text-xs text-slate-900 truncate">{candidate.name}</h4>
                          <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">{candidate.currentTitle}</p>

                          {candidate.alertTriggered && (
                            <div className="mt-2 text-[9px] bg-rose-50 text-rose-600 py-1 px-1.5 rounded flex items-center gap-1 font-mono">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              2D NO REPLY ALERT!
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Candidate CRM Drawer panel */}
        <div className="lg:col-span-1">
          {selectedCandidate ? (
            <div className="bg-white border rounded-2xl shadow-sm p-5 space-y-5 sticky top-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono tracking-wider font-semibold rounded uppercase px-2 py-0.5 bg-indigo-50 text-gray-700 dark:text-gray-300">
                      Pipeline state
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-semibold">{selectedCandidate.outreachStatus}</span>
                  </div>
                  <h3 className="font-sans font-bold text-slate-900 text-base">{selectedCandidate.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCandidate.currentTitle} at {selectedCandidate.company}</p>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              {/* Status details */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Match Suitability:</span>
                  <span className="font-bold text-slate-900">{selectedCandidate.matchScore}/10</span>
                </div>
                {selectedCandidate.outreachStatus === 'Outreach Sent' && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Days unanswered:</span>
                    <span className="font-mono text-amber-600 font-semibold">{selectedCandidate.daysSinceOutreach} Days</span>
                  </div>
                )}
                {selectedCandidate.alertTriggered && (
                  <div className="flex items-start gap-1 pb-1 text-xs text-rose-600 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Recruiter alert is active. Contact has gone cold.</span>
                  </div>
                )}
              </div>

              {/* CRM logs notes */}
              {selectedCandidate.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800">Recruiter Action Logs:</h4>
                  <div className="bg-indigo-50/40 text-xs text-slate-700 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 font-sans leading-relaxed">
                    {selectedCandidate.notes}
                  </div>
                </div>
              )}

              {/* Interactive Outreach drafting steps */}
              {selectedCandidate.outreachStatus === 'Enriched' && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-xs font-bold text-slate-800">Verify Outreach Draft Message:</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    This custom-generated campaign is primed. Starting sending initiates target message sequences.
                  </p>
                  <pre className="text-[9px] whitespace-pre-wrap font-mono bg-slate-900 text-slate-300 p-3 rounded-lg max-h-[140px] overflow-y-auto leading-relaxed border border-slate-800">
                    {selectedCandidate.outreachMessage || "No custom message created yet. Click 'Generate message' in matching lists."}
                  </pre>
                  <button
                    onClick={() => handleStartCampaign(selectedCandidate)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:bg-gray-800 text-white font-medium text-xs py-2.5 rounded-xl transition duration-150 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Start Sourcing Sequence
                  </button>
                </div>
              )}

              {/* Sourced candidate warning */}
              {selectedCandidate.outreachStatus === 'Sourced' && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 text-purple-900 space-y-2">
                  <h4 className="font-semibold text-[11px]">Enrichment Prerequisite</h4>
                  <p className="text-[11px] leading-relaxed">
                    This profile only has standard handle tags. Trigger Apollo/ZoomInfo data enrichment to reveal certified email addresses and telephone locations.
                  </p>
                </div>
              )}

              {/* Alerts manual takeover screen (recruiter phone log) */}
              {(selectedCandidate.outreachStatus === 'No Response' || selectedCandidate.outreachStatus === 'Replied' || selectedCandidate.outreachStatus === 'Opened' || selectedCandidate.outreachStatus === 'Outreach Sent') && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <CheckSquare className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    Manual Outreach Takeover
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Unlock contact credentials. Place manually logged phone calls or log customized feedback notes:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`mailto:${selectedCandidate.contact.email}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border text-[10px] font-medium py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 truncate"
                    >
                      <Mail className="w-3 h-3 text-slate-600 shrink-0" />
                      {selectedCandidate.contact.emailEnriched ? selectedCandidate.contact.email : 'Unenriched'}
                    </a>
                    {selectedCandidate.contact.phoneEnriched ? (
                      <a
                        href={`tel:${selectedCandidate.contact.phone}`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border text-[10px] font-medium py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 truncate"
                      >
                        <Phone className="w-3 h-3 text-slate-600 shrink-0" />
                        {selectedCandidate.contact.phone}
                      </a>
                    ) : (
                      <button
                        disabled
                        className="bg-slate-50 text-slate-400 border text-[10px] font-medium py-2 px-2 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        <Phone className="w-3 h-3" />
                        No Phone Key
                      </button>
                    )}
                  </div>

                  {/* Manual logs feed */}
                  <div className="space-y-2">
                    <textarea
                      placeholder="Add manual recruiter logs (e.g. 'Phoned candidate, left message on voice mailbox...')"
                      rows={3}
                      value={takeoverNotes}
                      onChange={(e) => setTakeoverNotes(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <button
                      onClick={() => handleSaveTakeoverNotes(selectedCandidate)}
                      disabled={takeoverNotes.trim() === ''}
                      className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded-xl transition duration-150"
                    >
                      Save Recruiter Actions Log
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed rounded-2xl p-6 text-center text-slate-400 font-sans flex flex-col items-center justify-center min-h-[300px]">
              <Clock className="w-8 h-8 text-slate-300 mb-2" />
              <h4 className="font-semibold text-xs text-slate-700">Recruiter Cockpit Panel</h4>
              <p className="text-[10px] text-slate-400 max-w-[180px] mt-1">
                Select a candidate anywhere on the left pipeline layout to manage outreaches or log manual task items.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
