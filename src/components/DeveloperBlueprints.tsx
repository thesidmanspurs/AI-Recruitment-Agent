/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Code, Server, Database, Globe, Lightbulb, CheckSquare, Layers, HelpCircle } from 'lucide-react';

export default function DeveloperBlueprints() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'api' | 'enrichment' | 'scheduler'>('architecture');

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden text-slate-800">
      {/* Blueprint Header */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-sans font-semibold tracking-tight">Technical Implementation blueprints</h2>
            <p className="text-xs text-slate-400 mt-1">Ready-to-ship architecture configurations, API routes, database schemas, and data enrichment protocols for your development team.</p>
          </div>
        </div>

        {/* Inner Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            System Architecture
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            API Endpoints & Schemas
          </button>
          <button
            onClick={() => setActiveTab('enrichment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'enrichment'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Apollo & ZoomInfo Sourcing
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'scheduler'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            No-Response Alerting Loop
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 border-b pb-2 mb-3">System Blueprint Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The solution replaces the slow manual scraping funnel with a modern <strong>event-driven full-stack architecture</strong>.
                Below is the standard pipeline diagram for candidate matching, enrichment, and tracking.
              </p>
            </div>

            {/* Architecture flow mockup */}
            <div className="bg-slate-55 p-4 rounded-xl border border-slate-100 font-mono text-xs text-slate-700 overflow-x-auto">
              <div className="whitespace-pre min-w-[600px]">
{`[Job Spec Ingest] -> [Gemini 3.5 Flash Model] 
                       |
                       +--> Parse keywords, alternate titles, & requirements spec
                       |
                       v
[Social Engines Crawling] <--- Trigger async requests (Reddit, LinkedIn Scraper, Upwork SDK)
                       |
                       +--> Filters candidates on: (score > minimum, Has "Open To Work" tag)
                       |
                       v
[Apollo/ZoomInfo Enrichment] <--- Map partial profiles to full contact data
                       |
                       +--> Injects verified emails, phones, and precise physical locations
                       |
                       v
[Multichannel Sequences] ---> Dispatches custom LinkedIn DMS & direct outreach emails
                       |
                       v
[Engagement Tracker Engine] ---> Smart Alerting Worker identifies non-responsive (2 Days Elapsed)
                                 and fires Webhook/Slack notify alerts to active recruiters.`}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  Recommended DB Schema (PostgreSQL/Mongo)
                </h4>
                <p className="text-xs text-slate-500 mb-3">Use a secure relation mapping for the candidate pipelines state.</p>
                <pre className="text-[10px] text-slate-700 font-mono bg-white p-2.5 rounded border leading-tight">
{`Table: candidates {
  id: uuid [pk]
  name: varchar(255)
  platform: enum('linkedin','upwork','reddit')
  profile_url: varchar(512)
  match_score: decimal(3,1)
  open_to_work: boolean
  enriched_email: varchar(255)
  enriched_phone: varchar(50)
  outreach_status: enum('sourced','enriched','sent','opened','replied','no_response')
  last_outreach_at: timestamp
  alert_triggered: boolean
  scraped_payload: jsonb
}`}
                </pre>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Developer Takeaway Checklist
                </h4>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <strong>API Proxy proxying:</strong> Always run external API integration (ZoomInfo, Apollo, LinkedIn scraping) from your NodeJS controller backend to keep access keys hidden.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <strong>Gemini 3.5 Flash:</strong> Use responseSchema properties to force output parsing into JSON, removing fragile regex cleaning.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <strong>Sandbox rules:</strong> Cache scraper requests using Redis to bypass aggressive third-party LinkedIn visual-checking throttles.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 border-b pb-2 mb-3">API Schema Configurations</h3>
              <p className="text-sm text-slate-600">
                These are the real endpoints serving this active prototype app. Implement them exactly as described to ensure seamless hand-off.
              </p>
            </div>

            <div className="space-y-4">
              {/* Endpoint 1 */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-mono font-bold rounded">POST</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/analyze-job-spec</span>
                  </div>
                  <span className="text-xs text-slate-500">Extracts keyword criteria from raw text</span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-600"><strong>Request Payload:</strong></p>
                  <pre className="text-xs text-slate-700 font-mono bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto">
{`{
  "jobText": "We are seeking a senior DevOps Engineer with Kubernetes, AWS, Prometheus expertise..."
}`}
                  </pre>
                  <p className="text-xs text-slate-600"><strong>Response Payload:</strong></p>
                  <pre className="text-xs text-slate-700 font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto">
{`{
  "success": true,
  "analysis": {
    "title": "Senior Specialist DevOps Engineer",
    "alternateTitles": ["Platform Reliability Architect", "SRE Kubernetes Expert"],
    "extractedKeywords": ["Kubernetes", "AWS", "Prometheus", "Terraform"],
    "requirements": ["Designing multi-cluster Kubernetes topologies", "Set up telemetry views"],
    "preferredPlatforms": ["LinkedIn", "Reddit"]
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Endpoint 2 */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-mono font-bold rounded">POST</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/generate-message</span>
                  </div>
                  <span className="text-xs text-slate-500">Crafts smart personalized DM and sequence drafts</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs text-slate-600"><strong>Required Query Parameters:</strong></p>
                  <pre className="text-xs text-slate-700 font-mono bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto">
{`{
  "candidate": { "name": "Elena Rostova", "skills": ["Kubernetes", "AWS"], "matchScore": 9.9 },
  "originalSpec": "Raw job criteria text..."
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrichment' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-2">Apollo & ZoomInfo Sourcing Setup</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              When sourcing is run on LinkedIn, candidates are parsed with initial profile parameters.
              However, traditional outreach has terrible open rates on LinkedIn. 
              Integrating APIs like <strong>Apollo.io</strong> or <strong>ZoomInfo</strong> resolves candidate names and companies into verified corporate email accounts.
            </p>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
              <h4 className="font-semibold text-indigo-900 text-xs flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                Apollo Search & Match Logic Sample
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Send a payload with the prospect&apos;s first name, last name, and current domain to extract exact corporate directory values:
              </p>
              <pre className="text-xs font-mono bg-white p-3 border border-indigo-100 text-indigo-950 rounded overflow-x-auto leading-tight">
{`import axios from 'axios';

async function enrichProspect(firstName, lastName, companyName) {
  const url = 'https://api.apollo.io/v1/people/match';
  const response = await axios.post(url, {
    api_key: process.env.APOLLO_API_KEY,
    first_name: firstName,
    last_name: lastName,
    organization_name: companyName
  });
  
  return {
    email: response.data.person?.email,
    phone: response.data.person?.phone_numbers?.[0]?.raw_number,
    location: response.data.person?.city + ", " + response.data.person?.state
  };
}`}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-900 mb-1">Critical Performance Tip</h4>
              <p className="text-xs text-slate-600">
                To maximize search throughput and protect request limits, cache corporate domain resolutions. Start with fuzzy matching by looking for shared employee networks inside Upwork, Github, or Reddit.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'scheduler' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-2">No-Response & Delay Alerts</h3>
            <p className="text-sm text-slate-600">
              A major gap in recruiting is losing momentum. The <strong>Smart Alerting Worker</strong> queries outreach entries that remain unanswered.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                <h4 className="font-semibold text-amber-900 text-xs flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                  Scheduler Logic (Node + Cron)
                </h4>
                <p className="text-xs text-slate-600">
                  Run a routine cron job once every hour to flag contacts dispatched more than 2 days ago lacking reply timestamps.
                </p>
                <pre className="text-[10px] text-slate-800 font-mono bg-white p-2 border border-amber-100 rounded leading-normal">
{`import cron from 'node-cron';

// Execute check daily at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  const staleOutreach = await db.query(\`
    SELECT * FROM candidates 
    WHERE outreach_status = 'Outreach Sent' 
      AND last_outreach_at < NOW() - INTERVAL '2 days'
      AND alert_triggered = false
  \`);
  
  for (const candidate of staleOutreach) {
    // 1. Dispatch Webhook / Slack notification
    await triggerSlackAlert(candidate);
    
    // 2. Mark alert as triggered
    await db.query(\`
      UPDATE candidates 
      SET alert_triggered = true, 
          outreach_status = 'No Response' 
      WHERE id = $1
    \`, [candidate.id]);
  }
});`}
                </pre>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl">
                  <h4 className="text-xs font-semibold text-indigo-900 mb-1">Immediate Value for Recruiters</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    By proactively surfacing candidate details that have gone cold directly to the recruiter&apos;s cockpit interface (Slack, Text, inside CRM), the system ensures high engagement rates and helps recruiters take over manually with a direct phone call.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <h4 className="text-xs font-semibold text-slate-900 mb-1">Integrating Twilio or SendGrid</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Once alert status triggers, your developers can configure standard SMTP tools (like SendGrid) to automatically schedule a secondary warm follow-up template.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
