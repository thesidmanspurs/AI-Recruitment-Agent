/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Candidate, ActivityLog, OutreachStatus } from '../types';
import { 
  Globe, Mail, Phone, MapPin, Database, Award, 
  Search, ShieldAlert, Sparkles, UserCheck, 
  HelpCircle, RefreshCw, Layers 
} from 'lucide-react';
import { motion } from 'motion/react';

interface EnrichmentDashboardProps {
  candidates: Candidate[];
  onUpdateCandidate: (candidate: Candidate) => void;
  onAddLog: (message: string, type: ActivityLog['type']) => void;
}

export default function EnrichmentDashboard({
  candidates,
  onUpdateCandidate,
  onAddLog
}: EnrichmentDashboardProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [enrichmentSource, setEnrichmentSource] = useState<'Apollo' | 'ZoomInfo'>('Apollo');
  const [isEnriching, setIsEnriching] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);

  // Filter candidates waiting for enrichment (i.e. currently Sourced)
  const waitlist = candidates.filter(c => c.outreachStatus === 'Sourced');

  // Toggle checkmark list selection
  const handleToggleSelect = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter(item => item !== id));
    } else {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === waitlist.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(waitlist.map(c => c.id));
    }
  };

  // Run Enrichment simulation
  const handleTriggerEnrichment = () => {
    if (selectedCandidates.length === 0) return;

    setIsEnriching(true);
    setCurrentProgress(10);
    onAddLog(`Initiating structural profile enrichment via ${enrichmentSource} API...`, 'system');

    // Interval loader
    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 400);

    setTimeout(() => {
      // Complete bulk updates
      selectedCandidates.forEach(id => {
        const candidate = candidates.find(c => c.id === id);
        if (candidate) {
          // Generate realistic emails and phone keys
          const cleanName = candidate.name.toLowerCase().replace(/\s+/g, '');
          const domain = candidate.company.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '') || 'domain';
          const mockEmail = `${cleanName}@${domain}.com`;
          
          const areaCodes = ['415', '212', '312', '512', '650'];
          const randomArea = areaCodes[Math.floor(Math.random() * areaCodes.length)];
          const mockPhone = `+1 (${randomArea}) 555-01${Math.floor(10 + Math.random() * 90)}`;
          
          const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Chicago, IL', 'Remote, USA'];
          const mockLocation = candidate.platform === 'Reddit' ? locations[Math.floor(Math.random() * locations.length)] : (candidate.contact.location || 'San Francisco, CA');

          const updated: Candidate = {
            ...candidate,
            outreachStatus: 'Enriched' as OutreachStatus,
            contact: {
              email: mockEmail,
              phone: mockPhone,
              location: mockLocation,
              emailEnriched: true,
              phoneEnriched: true,
              linkedinUrl: candidate.contact.linkedinUrl || `https://linkedin.com/in/${cleanName}`
            }
          };
          onUpdateCandidate(updated);
        }
      });

      clearInterval(interval);
      setIsEnriching(false);
      setCurrentProgress(0);
      onAddLog(`Successfully enriched ${selectedCandidates.length} profiles. Discovered contact detail payloads locked in CRM.`, 'enrich');
      setSelectedCandidates([]);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Intro section */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Automated Data Enrichment Panel
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Recruiters lack direct email addresses or phone keys of social prospects. 
              The AI Sourcing agent integrates with third-party datasets (such as <strong>Apollo</strong> and <strong>ZoomInfo</strong>) to instantly map active LinkedIn handles to validated corporate contact lines.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white border rounded-xl p-1.5 self-start">
            <button
              onClick={() => setEnrichmentSource('Apollo')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition duration-150 ${
                enrichmentSource === 'Apollo'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Apollo API
            </button>
            <button
              onClick={() => setEnrichmentSource('ZoomInfo')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition duration-150 ${
                enrichmentSource === 'ZoomInfo'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              ZoomInfo API
            </button>
          </div>
        </div>
      </div>

      {/* Main Enrichment Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Sourced waitlist candidates list */}
        <div className="md:col-span-2 bg-white border border-slate-250/60 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h4 className="font-sans font-bold text-slate-900 text-xs">Candidates Awaiting Enrichment</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Select sourced candiates to initiate batch database lookup.</p>
            </div>
            
            {waitlist.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-500 font-sans font-semibold text-xs transition duration-150"
              >
                {selectedCandidates.length === waitlist.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {waitlist.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <UserCheck className="w-8 h-8 text-slate-300 mb-2" />
              <h5 className="font-semibold text-xs text-slate-700">All Candidates Enriched</h5>
              <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                Every candidate presently in your sourced array features unlocked emails coordinates, or you have not sourced any profile batches yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {waitlist.map((candidate) => {
                const isSelected = selectedCandidates.includes(candidate.id);
                return (
                  <div
                    key={candidate.id}
                    onClick={() => handleToggleSelect(candidate.id)}
                    className={`flex items-start justify-between p-3.5 border rounded-xl cursor-pointer transition duration-150 ${
                      isSelected 
                        ? 'border-indigo-400 bg-indigo-50/20' 
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Swallowed: handled by outer div click
                          className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-slate-900 leading-none">{candidate.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium">
                            {candidate.platform}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {candidate.currentTitle} at <strong className="text-slate-700 font-medium">{candidate.company}</strong>
                        </p>

                        {/* Dummy preview metrics showing fuzzy states before lookup */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {candidate.name.charAt(0).toLowerCase()}•••••@${candidate.company.toLowerCase().replace(/\s/g, '') || 'company'}.com
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            +1 (•••••) •••-••••
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Match ⭐ {candidate.matchScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Controls */}
          {waitlist.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t">
              <span className="text-xs text-slate-500">
                {selectedCandidates.length} of {waitlist.length} selected for API parsing
              </span>

              <button
                onClick={handleTriggerEnrichment}
                disabled={selectedCandidates.length === 0 || isEnriching}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2.5 rounded-xl transition duration-150 shadow-sm"
              >
                {isEnriching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                {isEnriching ? `Matching Profile Records (${currentProgress}%)` : `Enrich Selected Candidates (${selectedCandidates.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Enrichment metrics & value-proposition board */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-sans font-bold text-xs tracking-wider uppercase text-indigo-300">Data Splicing metrics</h4>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-xs text-slate-300">Enriched Candidates:</span>
                <span className="text-sm font-mono font-bold text-indigo-300">
                  {candidates.filter(c => c.contact.emailEnriched).length}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-xs text-slate-300">Average Database Match Rate:</span>
                <span className="text-sm font-mono font-bold text-emerald-400">92.4%</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs text-slate-300">Integrations Active:</span>
                <span className="text-sm font-mono font-bold text-indigo-300">2 API Keys</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Smart enrichment</strong> parses and matches candidate first, last, and domain records asynchronously using background webhooks.
              </span>
            </div>
          </div>

          {/* Quick instructions checklist */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-white space-y-3 shadow-xs">
            <h4 className="font-sans font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Manual Outreaches vs automation
            </h4>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Once profiles are enriched to <strong>Enriched</strong> status, your AI Outreach Agent generates localized templates matched exactly to their social backgrounds.
              </p>
              <p>
                You can trigger sending directly from the sequence tracker tab, which immediately triggers tracking rules for replies and alerting.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
