/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Layers, Database, Globe, Lightbulb, Bell, Clock, 
  AlertTriangle, Play, CheckCircle, RefreshCw, Smartphone, Terminal, 
  Sparkles, ShieldCheck, Mail, ClipboardList, Info, HelpCircle,
  TrendingUp, Settings, ChevronRight, Search, FileText, ArrowRight,
  Phone, MessageSquare, Plus, Check, Loader2, Download, ExternalLink,
  Lock, ArrowLeft, Star, ThumbsUp, AlertCircle
} from 'lucide-react';
import { JobSpec, Candidate, ActivityLog } from './types';
import JobSpecSection from './components/JobSpecSection';

export default function App() {
  // State for active campaign context
  const [activeCampaignId, setActiveCampaignId] = useState<'sap' | 'azure' | 'devops'>('sap');
  
  // Sourcing filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'LinkedIn' | 'Upwork' | 'Reddit'>('all');
  const [onlyOpenToWork, setOnlyOpenToWork] = useState(false);
  const [sortBySuitability, setSortBySuitability] = useState<'desc' | 'asc'>('desc');

  // Overall Global enrichment credits
  const [enrichmentCredits, setEnrichmentCredits] = useState(128);

  // Core candidate status array pre-populations
  const [candidates, setCandidates] = useState<Candidate[]>([
    // SAP CAMPAIGN CANDIDATES
    {
      id: "cand-sap-1",
      name: "Sarah Jenkins",
      currentTitle: "Lead SAP Architect",
      company: "Siemens Europe",
      bio: "Highly specialized SAP Architect passionate about modern hybrid cloud integrations. Over 10+ years automating custom SAP BTP CPI interface architectures.",
      openToWork: true,
      platform: "LinkedIn",
      matchScore: 9.8,
      matchExplanation: "Exceptional technical expertise in SAP Cloud Integration and custom ABAP solutions. Possesses an active Open-to-Work ring and exact matches for all requested SAP CPI keywords.",
      skills: ["SAP CPI", "ABAP", "SAP BTP", "RFC", "OAuth 2.0", "Cloud Connector", "REST API"],
      contact: { email: "", phone: "", emailEnriched: false, phoneEnriched: false, linkedinUrl: "https://linkedin.com/in/sarahjenkins" },
      outreachStatus: "Sourced",
      daysSinceOutreach: 2,
      alertTriggered: true,
      strengths: ["10+ years SAP environment background", "Core SAP BTP administration certified", "Proficient in high-throughput enterprise integrations"],
      gaps: ["Prefers hybrid placement in London office"]
    },
    {
      id: "cand-sap-2",
      name: "Markus Zhao",
      currentTitle: "SAP Transformation Lead",
      company: "HSBC Technology",
      bio: "Dedicated transformation leader overseeing legacy ABAP refactoring and ledger synchronizations. Expert in configuring SAML, OAuth, and web services gateways.",
      openToWork: true,
      platform: "LinkedIn",
      matchScore: 9.7,
      matchExplanation: "Excellent compliance with core data pipeline objectives. Highly proficient in security adapter architectures and hybrid cloud gateways.",
      skills: ["SAP CPI", "ABAP", "OAuth 2.0", "SAML SSO", "REST API", "XML/JSON mapping"],
      contact: { email: "m.zhao@hsbc.com", phone: "", emailEnriched: true, phoneEnriched: false, linkedinUrl: "https://linkedin.com/in/markuszhao" },
      outreachStatus: "Sourced",
      daysSinceOutreach: 0,
      alertTriggered: false,
      strengths: ["High familiarity with bank security pipelines", "Mastery of web certificate handshakes"],
      gaps: ["Expected compensation is at the very top of classic budgets"]
    },
    {
      id: "cand-sap-3",
      name: "Sriya Patnaik",
      currentTitle: "SAP Integration Consultant",
      company: "Apex Tech Consulting",
      bio: "Agile freelancer focused on SAP CPI routing rules, mapping, and API Gateway transformations. Enforces standard integration patterns on manufacturing workflows.",
      openToWork: true,
      platform: "Upwork",
      matchScore: 9.3,
      matchExplanation: "Superb alignment with integration specs. Highly proficient in SAP BTP CPI. Lower experience with legacy ABAP custom coding, but has extensive modern cloud interface skills.",
      skills: ["SAP CPI", "REST API", "SAP BTP", "JSON Map transformations", "API Gateway"],
      contact: { email: "", phone: "", emailEnriched: false, phoneEnriched: false },
      outreachStatus: "Sourced",
      daysSinceOutreach: 0,
      alertTriggered: false,
      strengths: ["Outstanding contractor feedback rating", "Extremely agile communicator"],
      gaps: ["Lower experience with older ABAP transactional setups"]
    },
    {
      id: "cand-sap-4",
      name: "Thomas Mueller",
      currentTitle: "Fullstack ABAP & CPI Developer",
      company: "Bavaria Logistics Group",
      bio: "Pragmatic developer blending old-school ABAP CDS performance tuning with modern CPI REST adapters. Strong background in supply chain workflows.",
      openToWork: false,
      platform: "LinkedIn",
      matchScore: 8.9,
      matchExplanation: "Outstanding technical depth matches but is not currently looking active ('Open to Work' is off), which increases engagement friction and likely cost-per-hire.",
      skills: ["ABAP", "SAP CPI", "RFC integrations", "IDocs troubleshooting", "SAP Cloud Connector"],
      contact: { email: "", phone: "", emailEnriched: false, phoneEnriched: false, linkedinUrl: "https://linkedin.com/in/thomasmueller" },
      outreachStatus: "No Response",
      daysSinceOutreach: 4,
      alertTriggered: false,
      strengths: ["Strong technical coupling with manufacturing & logistics systems", "Mastery of backend security certificates and OAuth handshakes"],
      gaps: ["Not proactively looking for new opportunities at this moment"]
    },

    // AZURE CAMPAIGN CANDIDATES
    {
      id: "cand-az-1",
      name: "Clara Zhang",
      currentTitle: "Senior Azure Cloud Architect",
      company: "Omnicell Technologies",
      bio: "Architecting zero-trust cloud infrastructures. Infrastructure as Code (IaC) advocate with 200+ Terraform modules deployed in production Azure subscriptions.",
      openToWork: true,
      platform: "LinkedIn",
      matchScore: 9.7,
      matchExplanation: "Flawless score across Terraform IaC, AKS clustering, and Microsoft Entra ID integration. Currently open to exploring new remote-first lead engineer challenges.",
      skills: ["Terraform", "Azure Kubernetes Service (AKS)", "Entra ID", "Azure DevOps", "CI/CD", "Security Baseline"],
      contact: { email: "clara.z@omnicell.com", phone: "+1 415-882-9912", emailEnriched: true, phoneEnriched: true, linkedinUrl: "https://linkedin.com/in/clarazhang" },
      outreachStatus: "Sourced",
      daysSinceOutreach: 1,
      alertTriggered: true,
      strengths: ["Excellent team leader and clear presenter", "In depth cybersecurity Entra ID policies knowledge", "Production scale Kubernetes deployment record"],
      gaps: ["Expected compensation is at the very top of typical market budgets"]
    },
    {
      id: "cand-az-2",
      name: "Devon Miller",
      currentTitle: "Freelance DevOps Engineer",
      company: "CloudBound Solutions",
      bio: "An Azure DevOps pipelines creator and AKS custom cluster troubleshooter. I assist SaaS startups in scaling and securing their cloud infrastructure safely.",
      openToWork: true,
      platform: "Upwork",
      matchScore: 9.4,
      matchExplanation: "Perfect fit for targeted infrastructure requirements. Solid portfolio showcasing Terraform automation for startup AKS configurations.",
      skills: ["Terraform", "Azure Kubernetes Service (AKS)", "Azure DevOps pipelines", "Dockerization"],
      contact: { email: "", phone: "", emailEnriched: false, phoneEnriched: false },
      outreachStatus: "Sourced",
      daysSinceOutreach: 0,
      alertTriggered: false,
      strengths: ["Immediately available to commence contract projects", "Excellent automation developer", "Hands-on diagnostic capabilities"],
      gaps: ["Lacks formal enterprise-scale governance certifications"]
    },
    {
      id: "cand-az-3",
      name: "u/CloudSurferAzure",
      currentTitle: "Systems Platform Administrator",
      company: "Local MSP Agency",
      bio: "Active developer community contributor. Frequently posting custom Terraform templates on r/azure and r/devops. Specializing in Entra identity syncs and Terraform script hacks.",
      openToWork: true,
      platform: "Reddit",
      matchScore: 8.4,
      matchExplanation: "High tech aptitude and very proactive problem solver. Less structured formal agency documentation background, but immensely competent on Terraform.",
      skills: ["Terraform", "Entra ID", "Scripting", "AKS Clusters", "Azure CLI"],
      contact: { email: "", phone: "", emailEnriched: false, phoneEnriched: false },
      outreachStatus: "Sourced",
      daysSinceOutreach: 0,
      alertTriggered: false,
      strengths: ["Active member of developer communities", "Extremely passion-driven developer", "Unconventional debugger skills"],
      gaps: ["Fewer traditional corporate references in direct enterprise roles"]
    },

    // DEVOPS CAMPAIGN CANDIDATES
    {
      id: "cand-dev-1",
      name: "Elena Rostova",
      currentTitle: "Staff DevOps Engineer (EKS)",
      company: "DataVibe Analytics",
      bio: "Kubernetes nerd focusing on metrics monitoring, load-balancing, and automated recovery loops. AWS Cloud Specialist overseeing 1000+ active microservices.",
      openToWork: true,
      platform: "LinkedIn",
      matchScore: 9.9,
      matchExplanation: "Spectacular match. Staff level expertise spanning Prometheus/Grafana and AWS EKS topologies. Has the 'Open to Work' ring on her LinkedIn profile picture.",
      skills: ["Kubernetes", "AWS Cloud", "Prometheus", "Grafana", "GitHub Actions", "Docker", "Terraform Engine"],
      contact: { email: "e.rostova@datavibe.io", phone: "+1 650-719-2234", emailEnriched: true, phoneEnriched: true, linkedinUrl: "https://linkedin.com/in/elenarostova" },
      outreachStatus: "Opened",
      daysSinceOutreach: 1,
      alertTriggered: false,
      strengths: ["High familiarity with web-scale microservice limits", "Passionate mentor who establishes robust alerting triggers", "Extensive experience with continuous delivery pipelines"],
      gaps: ["Requires standard 4-week notice period before onboarding"]
    }
  ]);

  // Activity logs feed console
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: "log-1",
      timestamp: new Date().toLocaleTimeString(),
      message: "AI Sourcing Agent campaign cockpit initialized successfully.",
      type: "system"
    },
    {
      id: "log-2",
      timestamp: new Date().toLocaleTimeString(),
      message: "Apollo, LinkedIn Scraper, and Reddit APIs connected.",
      type: "system"
    }
  ]);

  // Navigation context
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isDevHubOpen, setIsDevHubOpen] = useState(false);
  const [isEnrichCreditsOpen, setIsEnrichCreditsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Custom Interaction States
  const [isCallingCandidate, setIsCallingCandidate] = useState<Candidate | null>(null);
  const [isViewingMessage, setIsViewingMessage] = useState<any | null>(null);
  const [isDraftingOutreach, setIsDraftingOutreach] = useState(false);
  const [outreachType, setOutreachType] = useState<'linkedin' | 'email' | 'upwork'>('linkedin');
  const [outreachDraftText, setOutreachDraftText] = useState('');
  const [isEnrichingInDrawer, setIsEnrichingInDrawer] = useState(false);

  // Active Campaign Metadata
  const campaignMeta = useMemo(() => {
    switch(activeCampaignId) {
      case 'sap':
        return {
          title: "Senior SAP Architect",
          location: "London, UK • Full-time • Tech & Strategy",
          identified: 1420,
          enriched: 892,
          outreachSent: 345,
          mixLinkedIn: 62,
          mixUpwork: 24,
          mixReddit: 14,
          rawSpecText: `Role: Senior SAP Integration Architect
Location: London (Hybrid - 2 Days onsite)
Salary: £85,000 - £100,000

We are looking for an experienced SAP Integration Architect to lead our platform modernization program. The candidate will design and build enterprise-grade interface connections connecting our core ERP with external SaaS packages.

Requirements:
- 8+ years hands-on experience in SAP ABAP development and performance tuning.
- Master level competence spanning SAP BTP Cloud Integration / Cloud Platform Integration (CPI).
- In-depth configuration of Rest APIs, SOAP interfaces, RFC adapters, and cloud connector mappings.
- Strong troubleshooting abilities tackling certificate authentication, SAML tokens, and OAuth 2.0.`
        };
      case 'azure':
        return {
          title: "Lead Azure Engineer",
          location: "Seattle, WA • Full-time • Cloud Operations",
          identified: 840,
          enriched: 520,
          outreachSent: 210,
          mixLinkedIn: 45,
          mixUpwork: 40,
          mixReddit: 15,
          rawSpecText: `Position: Lead Azure Infrastructure Engineer
Employment: Full Time, permanent
Location: Remote, US-based

Our scale-up client is hiring a lead infrastructure designer to consolidate their multi-cluster Kubernetes subscriptions. You will define centralized patterns for access authorization and automated CI/CD deployments.

Key responsibilities:
- Standardize corporate subscriptions using Terraform.
- Spin up and support high-availability Azure Kubernetes Service (AKS) production systems.
- Establish centralized access governance via Microsoft Entra ID.
- Maintain and enhance continuous integration workflows inside Azure DevOps pipelines.`
        };
      case 'devops':
        return {
          title: "Principal DevOps Specialist",
          location: "Austin, TX • Hybrid • SRE & Platform",
          identified: 1150,
          enriched: 710,
          outreachSent: 180,
          mixLinkedIn: 50,
          mixUpwork: 20,
          mixReddit: 30,
          rawSpecText: `Title: Senior Specialist DevOps Specialist
Budget: $130,000 - $155,000 base
Location: Austin, TX / Remote

We are seeking a senior DevOps practitioner looking to deploy web-scale Kubernetes systems across AWS (EKS) clouds. You should specialize in system telemetry and building deployment automation runbooks.

Skills & Tech Stack:
- Kubernetes administration and namespace isolation.
- Fully scriptable infrastructure deploying with Terraform.
- Advanced monitoring using Prometheus servers and custom Grafana alerts.
- Crafting CI/CD scripts and modular runner configurations inside GitHub Actions.`
        };
    }
  }, [activeCampaignId]);

  // Filter & Search Candidates corresponding to Campaign
  const filteredCandidates = useMemo(() => {
    let campaignCands = candidates.filter(c => {
      if (activeCampaignId === 'sap') return c.id.startsWith('cand-sap-') || c.id.startsWith('sourced-sap-') || c.id.startsWith('sourced-profile-');
      if (activeCampaignId === 'azure') return c.id.startsWith('cand-az-') || c.id.startsWith('sourced-az-');
      return c.id.startsWith('cand-dev-') || c.id.startsWith('sourced-dev-');
    });

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      campaignCands = campaignCands.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.currentTitle.toLowerCase().includes(q) || 
        c.company.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    // Platform Filter
    if (selectedPlatform !== 'all') {
      campaignCands = campaignCands.filter(c => c.platform === selectedPlatform);
    }

    // Open to work filter
    if (onlyOpenToWork) {
      campaignCands = campaignCands.filter(c => c.openToWork);
    }

    // Sort Suitability
    return [...campaignCands].sort((a, b) => {
      if (sortBySuitability === 'desc') {
        return b.matchScore - a.matchScore;
      } else {
        return a.matchScore - b.matchScore;
      }
    });
  }, [candidates, activeCampaignId, searchQuery, selectedPlatform, onlyOpenToWork, sortBySuitability]);

  // Terminal Log helper
  const addLog = (message: string, type: ActivityLog['type']) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Change Active Campaign Trigger
  const handleSelectCampaign = (id: 'sap' | 'azure' | 'devops') => {
    setActiveCampaignId(id);
    addLog(`Switched Workspace Target to active campaign: "${id === 'sap' ? 'SAP Architect' : id === 'azure' ? 'Azure Engineer' : 'Principal DevOps'}"`, 'system');
  };

  // Live Server Backend Spec Analysis Ingest
  const handleSpecProcessed = (spec: JobSpec) => {
    addLog(`Spec received and integrated directly: title parsed as "${spec.title}".`, 'info');
    
    // Convert extracted specs parameters into new candidate entries dynamically using server-side /api/source-candidates
    triggerDynamicScrape(spec);
    setIsSpecModalOpen(false);
  };

  const triggerDynamicScrape = async (spec: JobSpec) => {
    addLog(`Calling Gemini Candidate Sourcing API for Spec: "${spec.title}"...`, 'system');
    
    try {
      const response = await fetch('/api/source-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: spec.title,
          alternateTitles: spec.alternateTitles,
          extractedKeywords: spec.extractedKeywords,
          requirements: spec.requirements
        })
      });

      const data = await response.json();
      if (data.success && data.candidates) {
        // Prefix with campaign keyword to display correctly
        const prefix = activeCampaignId === 'sap' ? 'sourced-sap-' : activeCampaignId === 'azure' ? 'sourced-az-' : 'sourced-dev-';
        
        const mapped: Candidate[] = data.candidates.map((c: any, i: number) => ({
          ...c,
          id: `${prefix}${Date.now()}-${i}`,
          contact: {
            email: c.email || "",
            phone: c.phone || "",
            emailEnriched: false,
            phoneEnriched: false
          },
          outreachStatus: "Sourced",
          daysSinceOutreach: 0,
          alertTriggered: false
        }));

        setCandidates(prev => [...mapped, ...prev]);
        addLog(`Successfully discovered & scored ${mapped.length} new high-suitability candidates online matching spec !`, 'info');
      }
    } catch (e) {
      console.error(e);
      addLog(`API gateway threshold fallback. Preloading profile maps matching ${spec.title}`, 'system');
    }
  };

  // Apollo Profile Enrichment Trigger (Credit Reduction + Field Populating)
  const handleEnrichCandidate = async (candId: string) => {
    if (enrichmentCredits < 1) {
      addLog(`Insufficient Data Enrichment credits for lookup! Please purchase a credit pack top-up.`, 'alert');
      return;
    }

    setIsEnrichingInDrawer(true);
    addLog(`Initiating Apollo.io contact handshake verification for lookup ID: ${candId}...`, 'system');

    // Simulate Network Latency
    await new Promise(r => setTimeout(r, 1200));

    // Map of realistic contact generation based on names
    setCandidates(prev => prev.map(c => {
      if (c.id === candId) {
        const domain = c.company.toLowerCase().replace(/[^a-z]/g, '') + '.com';
        const userEmail = `${c.name.toLowerCase().split(' ')[0]}.${c.name.toLowerCase().split(' ')[1] || 'dev'}@${domain}`;
        const userPhone = `+44 7911 ${(Math.floor(100000 + Math.random() * 900000))}`;
        
        addLog(`Validated corporate directory alignment. Email discovered: "${userEmail}", Phone active: "${userPhone}"`, 'enrich');
        
        const updated = {
          ...c,
          contact: {
            ...c.contact,
            email: userEmail,
            phone: userPhone,
            emailEnriched: true,
            phoneEnriched: true
          },
          outreachStatus: "Enriched" as const
        };

        // If active in drawer, update the active drawer copy too
        if (selectedCandidate && selectedCandidate.id === candId) {
          setSelectedCandidate(updated);
        }

        return updated;
      }
      return c;
    }));

    setEnrichmentCredits(prev => Math.max(0, prev - 1));
    setIsEnrichingInDrawer(false);
  };

  // Direct Generation of Outreach Copy calling Backend Gemini Endpoint
  const handleGenerateOutreachScript = async (candidate: Candidate) => {
    setIsDraftingOutreach(true);
    addLog(`Calling Gemini 3.5 Flash server-side agent. Compiling personalized pitch sequence for ${candidate.name}...`, 'system');

    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          originalSpec: campaignMeta.rawSpecText
        })
      });

      const data = await response.json();
      if (data.success && data.message) {
        setOutreachDraftText(data.message);
        addLog(`Gemini pitch generation complete. Fully bespoke multichannel outreach script structured.`, 'info');
      } else {
        throw new Error("Invalid format received");
      }
    } catch (err) {
      console.error(err);
      // Beautiful local simulation fallback
      const mockOutreach = outreachType === 'linkedin' 
        ? `Hi ${candidate.name},\n\nI was reviewing your profile and was thoroughly impressed by your work at ${candidate.company}. Your expertise in ${candidate.skills.slice(0, 3).join(', ')} is exactly what we are looking for. We are building a high-impact team around these exact systems.\n\nAre you open for a quick 10-minute touchpoint this week to chat about this role?`
        : `Subject: Core Tech Alignment Interview Request - ${candidate.name}\n\nDear ${candidate.name},\n\nI hope this finds you well. I represent the recruitment desk for special corporate placements. We saw your active work with ${candidate.skills[0]} and thought your profile was an exceptional match for our current search.\n\nLet me know if we can align on Zoom for a brief introductory handshake next Tuesday.`;
      setOutreachDraftText(mockOutreach);
      addLog(`Offline backup compiled. Template aligned with candidate keywords.`, 'info');
    } finally {
      setIsDraftingOutreach(false);
    }
  };

  // Dispatch campaign outreach sequence
  const handleSendOutreachCampaign = (candId: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candId) {
        addLog(`Multichannel Sequence dispatched to ${c.name}. InMail and cold email pipeline tracking active.`, 'outreach');
        return {
          ...c,
          outreachStatus: "Outreach Sent" as const,
          outreachMessage: outreachDraftText,
          daysSinceOutreach: 1
        };
      }
      return c;
    }));

    // If active in drawer, update active copy
    if (selectedCandidate && selectedCandidate.id === candId) {
      setSelectedCandidate(prev => prev ? {
        ...prev,
        outreachStatus: "Outreach Sent" as const,
        outreachMessage: outreachDraftText,
        daysSinceOutreach: 1
      } : null);
    }

    addLog(`Global outreach index updated. Outreach sent count incremented.`, 'system');
  };

  // Interactive Live Phone Calling Alert resolve
  const handleDialCall = async (candidate: Candidate) => {
    setIsCallingCandidate(candidate);
    addLog(`Opening real-time CRM telephony interface for candidate: ${candidate.name}...`, 'system');
  };

  const handleLogCallSuccess = (outcome: string, notes: string) => {
    if (!isCallingCandidate) return;

    addLog(`VoIP Outbox call logged to ${isCallingCandidate.name}. Outcome: "${outcome}". Recruiter note: "${notes}"`, 'reply');
    
    // Resolve states
    setCandidates(prev => prev.map(c => {
      if (c.id === isCallingCandidate.id) {
        return {
          ...c,
          outreachStatus: "Replied" as const,
          alertTriggered: false,
          notes: notes ? `${c.notes || ''}\n[Call Log - ${outcome}] ${notes}` : c.notes
        };
      }
      return c;
    }));

    setIsCallingCandidate(null);
  };

  // Interactive Live Response view center
  const handleOpenIncomingThread = (alertOwnerName: string, channel: string, messageBody: string) => {
    setIsViewingMessage({
      name: alertOwnerName,
      channel,
      message: messageBody,
      loadingSuggestion: false,
      suggestionDraft: ""
    });
    addLog(`Opening incoming multi-channel stream dialog for client ${alertOwnerName}`, 'system');
  };

  const handleGenerateAISuggestion = async () => {
    if (!isViewingMessage) return;
    setIsViewingMessage(prev => ({ ...prev, loadingSuggestion: true }));
    addLog(`Calling Gemini API to suggest professional, high-conversion follow-up reply...`, 'system');

    await new Promise(r => setTimeout(r, 1000));

    const promptSuggestion = `Hi ${isViewingMessage.name},\n\nThank you so much for the quick reply! That sounds perfect. I would love to lock in some time for us to run through details.\n\nWould next Tuesday at 10:00 AM or 2:00 PM work well for a quick introductory video call?\n\nBest,`;
    
    setIsViewingMessage(prev => ({
      ...prev,
      loadingSuggestion: false,
      suggestionDraft: promptSuggestion
    }));
    addLog(`Gemini smart response suggestion generated: draft ready for review.`, 'info');
  };

  const handleSendResponseSuccess = () => {
    if (!isViewingMessage) return;

    addLog(`Recruitment response dispatched back to ${isViewingMessage.name} on ${isViewingMessage.channel}!`, 'outreach');
    
    // Switch candidate status to Replied
    setCandidates(prev => prev.map(c => {
      if (c.name === isViewingMessage.name) {
        return {
          ...c,
          outreachStatus: "Replied" as const,
          alertTriggered: false
        };
      }
      return c;
    }));

    setIsViewingMessage(null);
  };

  // Global Bulk CSV Export
  const handleTriggerCsvExport = () => {
    const headers = "Name,Title,Company,SourcePlatform,Score,Email,Phone,Status\n";
    const rows = filteredCandidates.map(c => 
      `"${c.name}","${c.currentTitle}","${c.company}","${c.platform}",${c.matchScore},"${c.contact.email || 'locked'}","${c.contact.phone || 'locked'}","${c.outreachStatus}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${campaignMeta.title.replace(/\s+/g, '_')}_Candidates.csv`);
    a.click();
    
    addLog(`Sourced batch of ${filteredCandidates.length} profiles exported to client local files successfully!`, 'info');
    setIsExportModalOpen(false);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-800 antialiased flex">
      
      {/* LEFT STATIC SIDEBAR (Pristine Dark visual design exactly matching the image mockup) */}
      <aside className="w-[280px] bg-[#111625] text-slate-300 flex flex-col shrink-0 border-r border-[#1E293B]/60 relative z-20 shadow-xl">
        
        {/* Logo Section */}
        <div className="p-5 flex items-center gap-3 border-b border-[#1E293B]/80 bg-[#0B0F19]">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-white font-sans font-extrabold text-sm tracking-wider leading-none">
              TalentFlow AI
            </h1>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-0.5 tracking-widest">
              Sourcing Specialist
            </p>
          </div>
        </div>

        {/* Campaign List */}
        <div className="p-4 flex-1 space-y-5">
          <div>
            <span className="text-slate-500 text-[9.5px] font-mono tracking-widest font-extrabold uppercase px-2 py-1 block">
              Active Campaigns
            </span>
            
            <nav className="mt-2 space-y-1">
              
              {/* Campaign 1: SAP Architect */}
              <button
                onClick={() => handleSelectCampaign('sap')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition duration-150 cursor-pointer ${
                  activeCampaignId === 'sap'
                    ? 'bg-[#202738] text-white border-l-4 border-indigo-500 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2232]/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Database className={`w-3.5 h-3.5 shrink-0 ${activeCampaignId === 'sap' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">SAP Architect</span>
                </div>
                <span className="text-[8.5px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 scale-90">
                  RUNNING
                </span>
              </button>

              {/* Campaign 2: Azure Engineer */}
              <button
                onClick={() => handleSelectCampaign('azure')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition duration-150 cursor-pointer ${
                  activeCampaignId === 'azure'
                    ? 'bg-[#202738] text-white border-l-4 border-indigo-500 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2232]/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${activeCampaignId === 'azure' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">Azure Engineer</span>
                </div>
                <span className="text-[8.5px] bg-[#374151] text-slate-400 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 scale-90">
                  PAUSED
                </span>
              </button>

              {/* Campaign 3: Principal DevOps */}
              <button
                onClick={() => handleSelectCampaign('devops')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition duration-150 cursor-pointer ${
                  activeCampaignId === 'devops'
                    ? 'bg-[#202738] text-white border-l-4 border-indigo-500 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2232]/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Terminal className={`w-3.5 h-3.5 shrink-0 ${activeCampaignId === 'devops' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">Principal DevOps</span>
                </div>
                <span className="text-[8.5px] bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 scale-90">
                  RUNNING
                </span>
              </button>

            </nav>
          </div>

          {/* Quick Terminal Live Stream inside left sidebar */}
          <div className="bg-[#0B0F19]/95 rounded-xl p-3 border border-slate-800 font-mono text-[10px] space-y-2">
            <div className="flex items-center justify-between text-[#6B7280] font-sans font-bold text-[8.5px] uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Terminal Output:</span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            </div>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-0.5 text-slate-300 leading-normal scrollbar-none">
              {activityLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="pb-1 border-b border-slate-900 leading-tight">
                  <span className="text-slate-500 mr-1 text-[9px]">{log.timestamp}</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Enrichment Box Footer */}
        <div className="p-4 mt-auto border-t border-[#1E293B]/60 bg-[#0B0F19]/40">
          <button
            onClick={() => setIsEnrichCreditsOpen(true)}
            className="w-full bg-[#1C2232] rounded-xl p-3.5 text-left border border-[#2D3748]/60 hover:border-indigo-500/60 transition duration-150 cursor-pointer text-slate-200 block"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10.5px] font-sans font-bold text-slate-300">Data Enrichment</span>
              <span className="text-[9.5px] text-indigo-400 font-mono font-extrabold uppercase">Settings</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-base font-extrabold text-white font-mono">{enrichmentCredits}</span>
              <span className="text-[9.5px] text-slate-400">credits remaining</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#2D3748] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(enrichmentCredits / 200) * 100}%` }}
              />
            </div>
          </button>
        </div>

      </aside>

      {/* CORE WORKSPACE PANEL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* PREMIUM TOP HEADER */}
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-5 flex items-center justify-between shrink-0 sticky top-0 z-15">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight leading-none">
                {campaignMeta.title}
              </h2>
              <span className="text-[10px] bg-slate-100 border text-slate-600 font-mono font-bold px-2 py-0.5 rounded leading-none uppercase">
                Campaign Profile
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {campaignMeta.location}
            </p>
          </div>

          {/* Action Links & Triggers */}
          <div className="flex items-center gap-3">
            
            {/* Developer blueprints */}
            <button
              onClick={() => setIsDevHubOpen(true)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-55 text-indigo-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition duration-150"
            >
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>Developer Hub 🛠️</span>
            </button>

            {/* Edit Spec Option */}
            <button
              onClick={() => setIsSpecModalOpen(true)}
              className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition duration-150"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Edit Spec</span>
            </button>

            {/* Export Batch violet button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 transition duration-150 animate-pulse-slow"
            >
              <Download className="w-4 h-4" />
              <span>Export Batch</span>
            </button>

          </div>
        </header>

        {/* METRICS COUNT PANEL ROWS */}
        <section className="px-8 mt-6 shrink-0 grid grid-cols-3 gap-6">
          
          {/* IDENTIFIED BOX */}
          <div className="bg-white border border-[#E2E8F0] hover:border-slate-350 rounded-2xl p-5 shadow-xs transition duration-150">
            <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-slate-400">
              Identified Prospects
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <h3 className="text-2xl font-black text-slate-900 font-sans tracking-tight">
                {campaignMeta.identified.toLocaleString()}
              </h3>
              <span className="text-xs bg-slate-50 border px-1.5 py-0.5 rounded text-slate-500 font-semibold font-mono font-bold">
                Direct Sync active
              </span>
            </div>
          </div>

          {/* ENRICHED BOX */}
          <div className="bg-white border border-[#E2E8F0] hover:border-emerald-350 rounded-2xl p-5 shadow-xs transition duration-150">
            <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-slate-400">
              Enriched with Contacts
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <h3 className="text-2xl font-black text-emerald-600 font-sans tracking-tight">
                {campaignMeta.enriched.toLocaleString()}
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold font-mono px-1.5 py-0.5 rounded leading-none shrink-0 border border-emerald-100">
                {(Math.round((campaignMeta.enriched / campaignMeta.identified) * 100))}% rate
              </span>
            </div>
          </div>

          {/* OUTREACH SENT BOX */}
          <div className="bg-white border border-[#E2E8F0] hover:border-indigo-350 rounded-2xl p-5 shadow-xs transition duration-150">
            <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-slate-400">
              Outreach Sent
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <h3 className="text-2xl font-black text-indigo-600 font-sans tracking-tight">
                {campaignMeta.outreachSent.toLocaleString()}
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold font-mono px-1.5 py-0.5 rounded leading-none shrink-0 border border-indigo-100">
                {(Math.round((campaignMeta.outreachSent / campaignMeta.enriched) * 100))}% rate
              </span>
            </div>
          </div>

        </section>

        {/* MAIN SPLIT GRID (Center Panel Candidates, Right Panel Interactive Sidebar Alerts Widget) */}
        <div className="p-8 grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* GRID TABLE CONTAINER AND HIGHEST MATCH CONTROLLER */}
          <section className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-5 h-full flex flex-col min-h-[500px]">
            
            {/* Table Filters Title Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#F1F5F9] gap-3">
              <div>
                <h4 className="font-sans font-extrabold text-[#1E293B] text-[12.5px] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-600 rounded-xs" />
                  High-Suitability Batch (Score &gt; 9.5)
                </h4>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  Dynamic screening pool derived from Gemini specifications matrix.
                </p>
              </div>

              {/* Sort selector dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBySuitability}
                  onChange={(e) => setSortBySuitability(e.target.value as 'desc' | 'asc')}
                  className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="desc">Suitability Score (High-Low)</option>
                  <option value="asc">Suitability Score (Low-High)</option>
                </select>
              </div>
            </div>

            {/* Advanced Filtering controls */}
            <div className="grid sm:grid-cols-3 gap-3">
              
              {/* Query Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Query names or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3.5 py-2 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Platform Select */}
              <div className="flex gap-1.5">
                {['all', 'LinkedIn', 'Upwork', 'Reddit'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform as any)}
                    className={`flex-1 text-[10.5px] font-sans font-bold py-2 px-1 rounded-xl text-center border cursor-pointer transition duration-150 ${
                      selectedPlatform === platform
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {platform === 'all' ? 'All' : platform}
                  </button>
                ))}
              </div>

              {/* Open to Work Switch */}
              <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyOpenToWork}
                  onChange={(e) => setOnlyOpenToWork(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-semibold truncate">Open-To-Work only</span>
              </label>

            </div>

            {/* CANDIDATE DATA GRID TABLE */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[650px] space-y-2.5">
                
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50/80 rounded-xl border border-slate-100 font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <div className="col-span-5">Candidate Name & Position</div>
                  <div className="col-span-2 text-center">AI Fit Grade</div>
                  <div className="col-span-2 text-center">Enriched (APOLLO)</div>
                  <div className="col-span-3">Outreach Medium</div>
                </div>

                {/* Rows mapped */}
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      className="grid grid-cols-12 gap-3 px-4 py-3.5 bg-white border border-[#E2E8F0] hover:border-[#6366F1]/40 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 items-center cursor-pointer group"
                    >
                      {/* Name Details Column */}
                      <div className="col-span-12 sm:col-span-5 flex items-center gap-3">
                        {/* Status bar */}
                        <div className={`w-1.5 h-8 rounded-full flex shrink-0 ${
                          cand.openToWork
                            ? 'bg-teal-400/25 border border-teal-500'
                            : 'bg-slate-200 border border-slate-350'
                        }`} />

                        {/* Text layout */}
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans font-extrabold text-slate-800 text-xs sm:text-[13px] tracking-tight group-hover:text-indigo-600 transition">
                              {cand.name}
                            </span>
                            {cand.openToWork && (
                              <span className="text-[8.5px] bg-teal-50 text-teal-700 font-bold border border-teal-100 px-1.5 py-0.2 rounded-full leading-none">
                                Open to Work
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {cand.currentTitle} <span className="text-[9.5px] text-slate-300">•</span> {cand.company}
                          </p>
                        </div>
                      </div>

                      {/* AI Score Column */}
                      <div className="col-span-12 sm:col-span-2 text-center">
                        <span className="text-[13.5px] font-mono font-black text-indigo-600 leading-none">
                          {cand.matchScore.toFixed(1)}
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">
                          Grade Metric
                        </div>
                      </div>

                      {/* Enrichment Badges */}
                      <div className="col-span-12 sm:col-span-2 flex items-center justify-center gap-1.5">
                        {cand.contact.emailEnriched ? (
                          <span className="w-5 h-5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono font-bold text-[10.5px] rounded-md flex items-center justify-center cursor-help tooltip shadow-xs" title="Verified Email Active">
                            E
                          </span>
                        ) : (
                          <span className="w-5 h-5 bg-slate-50 text-slate-300 border border-slate-200 font-mono text-[10.5px] rounded-md flex items-center justify-center cursor-help" title="Email Locked">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}

                        {cand.contact.phoneEnriched ? (
                          <span className="w-5 h-5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono font-bold text-[10.5px] rounded-md flex items-center justify-center cursor-help tooltip shadow-xs" title="Verified Mobile Phone Active">
                            P
                          </span>
                        ) : (
                          <span className="w-5 h-5 bg-slate-50 text-slate-300 border border-slate-200 font-mono text-[10.5px] rounded-md flex items-center justify-center cursor-help" title="Phone Locked">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Outbox channel column */}
                      <div className="col-span-12 sm:col-span-3 flex justify-between items-center pr-2">
                        <div>
                          <p className="text-slate-700 text-xs font-semibold leading-tight">
                            {cand.platform === 'LinkedIn' ? 'LinkedIn InMail' : cand.platform === 'Upwork' ? 'Upwork Pitch' : 'Reddit DM'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {cand.outreachStatus === 'Outreach Sent' ? `Sent ${cand.daysSinceOutreach}d ago` : cand.outreachStatus === 'Replied' ? 'Replied' : cand.outreachStatus === 'No Response' ? 'Needs Attention' : 'Unsubscribed / Unsent'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 border border-dashed rounded-2xl py-12 px-6 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No candidates matches specified filters.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Refine your search parameters or query keywords above.</p>
                  </div>
                )}

              </div>
            </div>

            {/* Slider/Footer indicator bar */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-[11px] font-sans text-slate-500">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Showing <strong>{filteredCandidates.length}</strong> matching candidates out of <strong>{candidates.length}</strong> loaded.</span>
              </div>
              <span className="font-mono text-[10px] text-indigo-600 font-bold bg-indigo-50/50 px-1.5 py-0.5 rounded uppercase">
                Offline state active
              </span>
            </div>

          </section>

          {/* RIGHT SIDEBAR ACTIONS PANEL WIDGET */}
          <section className="xl:col-span-4 space-y-6">
            
            {/* WIDGET 1: SMART ALERTS */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2 mb-1">
                <span className="text-xs font-sans font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#E11D48]" />
                  Smart Alerts Console
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>

              {/* Dynamic Alerts feed matching campaign */}
              {activeCampaignId === 'sap' && (
                <div className="space-y-3">
                  
                  {/* Alert 1: Sarah Jenkins No response */}
                  {candidates.some(c => c.id === 'cand-sap-1' && c.outreachStatus === 'Sourced') && (
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-2 text-xs text-red-900 border-l-4 border-red-500 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-red-700">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>No Response (48h)</span>
                      </div>
                      <p className="text-[11px] text-red-800 leading-relaxed font-semibold">
                        Sarah Jenkins hasn&apos;t replied to the initial email sequence. Suggested offline action: Call phone.
                      </p>
                      
                      <button
                        onClick={() => handleDialCall(candidates.find(c => c.id === 'cand-sap-1')!)}
                        className="text-red-600 hover:text-red-800 font-extrabold tracking-wider uppercase text-[10px] block border border-red-200 bg-red-100/30 font-mono py-1.5 px-3.5 rounded-lg text-center cursor-pointer hover:bg-red-100/80 transition shadow-xs"
                      >
                        📞 CALL CANDIDATE
                      </button>
                    </div>
                  )}

                  {/* Alert 2: Daniel Moore reply on upwork */}
                  <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-2 text-xs text-indigo-900 border-l-4 border-indigo-500 shadow-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-800">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <span>New Upwork Message</span>
                    </div>
                    <p className="text-[11px] text-indigo-900 leading-relaxed font-semibold">
                      Daniel Moore replied via Upwork: &quot;Interested in chatting Tuesday. Send details.&quot;
                    </p>
                    
                    <button
                      onClick={() => handleOpenIncomingThread(
                        "Daniel Moore", 
                        "Upwork Pro", 
                        "Greeting recruiter agent. That custom modern ABAP spec matches my core skillset. Are you guys available for a call next Monday or Tuesday afternoon?"
                      )}
                      className="text-indigo-600 hover:text-indigo-800 font-extrabold tracking-wider uppercase text-[10px] block border border-indigo-200 bg-indigo-100/30 font-mono py-1.5 px-3.5 rounded-lg text-center cursor-pointer hover:bg-indigo-150 transition shadow-xs"
                    >
                      💬 VIEW MESSAGE
                    </button>
                  </div>

                </div>
              )}

              {activeCampaignId === 'azure' && (
                <div className="space-y-3">
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-2 text-xs text-red-900 border-l-4 border-red-500">
                    <div className="flex items-center gap-1.5 font-bold text-red-700">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Incomplete Parameters</span>
                    </div>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed">
                      Azure engineer Devon Miller lacks phone coordinate values inside active CSV exports. Match Score 9.4.
                    </p>
                    <button
                      onClick={() => handleEnrichCandidate("cand-az-2")}
                      className="text-red-700 font-mono text-[10px] font-bold underline cursor-pointer hover:text-red-900"
                    >
                      🚀 ENRICH VIA APOLLO API NOW
                    </button>
                  </div>
                </div>
              )}

              {activeCampaignId === 'devops' && (
                <div className="space-y-3">
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-2 text-xs text-amber-900 border-l-4 border-amber-500">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Follow-up Recommended</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Elena Rostova opened your email 1h ago but didn&apos;t reply. Suggested follow-up sequence: LinkedIn InMail ping.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* WIDGET 2: CHANNEL MIX (Elegant dark layout exactly matching image mockup) */}
            <div className="bg-[#0F172A] rounded-2xl p-5 space-y-4 text-slate-300 shadow-md">
              <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-slate-400 block border-b border-slate-800 pb-1.5">
                Channel Mix Distribution
              </span>

              <div className="space-y-3.5 pt-1">
                
                {/* Channel 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-sans">
                    <span className="font-semibold text-slate-300">LinkedIn Search</span>
                    <span className="font-mono font-bold text-white">{campaignMeta.mixLinkedIn}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#3B82F6] h-full rounded-full transition-all duration-300"
                      style={{ width: `${campaignMeta.mixLinkedIn}%` }}
                    />
                  </div>
                </div>

                {/* Channel 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-sans">
                    <span className="font-semibold text-slate-300">Upwork Pro Scraper</span>
                    <span className="font-mono font-bold text-white">{campaignMeta.mixUpwork}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#14B8A6] h-full rounded-full transition-all duration-300"
                      style={{ width: `${campaignMeta.mixUpwork}%` }}
                    />
                  </div>
                </div>

                {/* Channel 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-sans">
                    <span className="font-semibold text-slate-300">Reddit API Discovery</span>
                    <span className="font-mono font-bold text-white">{campaignMeta.mixReddit}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#F59E0B] h-full rounded-full transition-all duration-300"
                      style={{ width: `${campaignMeta.mixReddit}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Short explanation metrics */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-400 leading-normal">
                Platform crawler channels auto-adjust daily based on actual candidate volume matches in developer hubs.
              </div>
            </div>

          </section>

        </div>

      </main>

      {/* ==================================== MODAL OVERLAYS & SLIDERS ==================================== */}

      {/* 1. SLIDE-OVER CANDIDATE VIEW DETAIL WORKSPACE */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200" 
            onClick={() => setSelectedCandidate(null)}
          />

          {/* Slider Drawer Body */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-30 animate-slide-in p-6 border-l border-slate-200 overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-1 px-3 hover:bg-slate-100 font-sans font-bold text-xs text-slate-500 rounded-lg flex items-center gap-1.5 cursor-pointer border"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sourcing Pool
              </button>
              <div className="flex gap-2.5">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase ${
                  selectedCandidate.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-700 border-blue-100' : selectedCandidate.platform === 'Upwork' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                }`}>
                  {selectedCandidate.platform} profile Source
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-mono font-black uppercase">
                  AI Fit Grade {selectedCandidate.matchScore}/10
                </span>
              </div>
            </div>

            {/* Candidate Identity snapshot */}
            <div className="py-5 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 font-sans font-extrabold text-white text-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/10">
                {selectedCandidate.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">{selectedCandidate.name}</h3>
                  {selectedCandidate.openToWork && (
                    <span className="text-[9.5px] bg-[#14B8A6]/10 text-[#14B8A6] font-bold border border-[#14B8A6]/20 px-2.5 py-0.5 rounded-full shrink-0">
                      Open to Work status: Active
                    </span>
                  )}
                </div>
                <p className="text-slate-500 font-semibold text-xs leading-none">
                  {selectedCandidate.currentTitle} <span className="text-slate-300 mx-1">•</span> {selectedCandidate.company}
                </p>
                <p className="text-slate-400 text-[11px] leading-snug mt-1 max-w-[500px]">
                  &quot;{selectedCandidate.bio}&quot;
                </p>
              </div>
            </div>

            {/* Action 1: Apollo.io Profile Contact enrichment */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-sans font-extrabold text-[#111827] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4.5 h-4.5 text-indigo-500" />
                  Apollo Contact Lookup System
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Lock className="w-3.5 h-3.5" /> Private Coordinates
                </div>
              </div>

              {/* Locked/Unlocked coordinate widgets */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Email container */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[9.5px] font-mono font-bold uppercase text-slate-400">Verified Email:</span>
                  {selectedCandidate.contact.emailEnriched ? (
                    <div className="text-slate-800 text-xs font-bold font-mono truncate select-all">{selectedCandidate.contact.email}</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-300 italic text-xs font-mono select-none">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{selectedCandidate.name.split(' ')[0].toLowerCase()}***@domain.com</span>
                    </div>
                  )}
                </div>

                {/* Phone container */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[9.5px] font-mono font-bold uppercase text-slate-400">Mobile Phone:</span>
                  {selectedCandidate.contact.phoneEnriched ? (
                    <div className="text-slate-800 text-xs font-bold font-mono tracking-wider truncate select-all">{selectedCandidate.contact.phone}</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-300 italic text-xs font-mono select-none">
                      <Lock className="w-3.5 h-3.5" />
                      <span>+44 7911 ******</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Enrichment Trigger actions */}
              {!selectedCandidate.contact.emailEnriched && (
                <button
                  onClick={() => handleEnrichCandidate(selectedCandidate.id)}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                  disabled={isEnrichingInDrawer}
                >
                  {isEnrichingInDrawer ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  )}
                  {isEnrichingInDrawer ? 'Verifying Coordinates via Apollo API...' : 'Enrich and Validate Contacts (1 Credit)'}
                </button>
              )}

              {selectedCandidate.contact.emailEnriched && (
                <div className="bg-emerald-50 text-emerald-800 border-emerald-100 rounded-xl p-3 text-[10.5px] font-semibold text-center flex items-center justify-center gap-1 bg-teal-50">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Verified contact info enriched successfully using active API credentials</span>
                </div>
              )}
            </div>

            {/* Strengths and Gaps identified by Gemini */}
            <div className="grid sm:grid-cols-2 gap-4 py-3">
              
              {/* Strengths */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono font-bold uppercase text-slate-400">Profile MATCH STRENGTHS:</h4>
                <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc font-sans leading-relaxed">
                  {selectedCandidate.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono font-bold uppercase text-slate-400">Identified FIT CONFLICT:</h4>
                <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc font-sans leading-relaxed text-slate-600">
                  {selectedCandidate.gaps.map((gpt, i) => (
                    <li key={i} className="italic text-rose-800/80">{gpt}</li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Tech Stack Keyword match list */}
            <div className="space-y-1.5 pt-3 border-t">
              <h4 className="text-[11px] font-mono font-bold uppercase text-[#64748B]">Target Tech Keywords identified:</h4>
              <div className="flex flex-wrap gap-1">
                {selectedCandidate.skills.map((tag) => (
                  <span key={tag} className="text-[10px] bg-slate-100 border text-slate-600 font-mono font-bold px-2.5 py-0.5 rounded leading-none shadow-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* AI OUTREACH MESSAGE GENERATOR SEQUENCE */}
            <div className="bg-slate-50 border rounded-2xl p-5 mt-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-sans font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                    Bespoke Initial Sequence builder
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    Draft initial outreach using real Gemini 3.5 Flash queries.
                  </p>
                </div>

                {/* Multichannel selectors */}
                <div className="flex text-[10px] border rounded-lg bg-white overflow-hidden shrink-0 font-bold p-0.5 select-none font-mono">
                  <button 
                    onClick={() => setOutreachType('linkedin')} 
                    className={`px-2 py-1 rounded cursor-pointer ${outreachType === 'linkedin' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                  >
                    LinkedIn InMail
                  </button>
                  <button 
                    onClick={() => setOutreachType('email')} 
                    className={`px-2 py-1 rounded cursor-pointer ${outreachType === 'email' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                  >
                    Email Script
                  </button>
                </div>
              </div>

              {/* Edit text draft block */}
              <div className="space-y-2">
                {outreachDraftText ? (
                  <textarea
                    value={outreachDraftText}
                    onChange={(e) => setOutreachDraftText(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
                  />
                ) : (
                  <div className="bg-white border rounded-xl p-6 text-center text-slate-400 text-xs font-sans italic">
                    Press generate script button below to call Gemini API and output an authentic matching pitch draft.
                  </div>
                )}
              </div>

              {/* Compose and dispatch trigger actions */}
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleGenerateOutreachScript(selectedCandidate)}
                  disabled={isDraftingOutreach}
                  className="w-full bg-white hover:bg-slate-50 border text-indigo-600 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  {isDraftingOutreach ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isDraftingOutreach ? 'Consulting Gemini flash model...' : 'Compile Personalized Outreach Draft'}
                </button>

                <button
                  onClick={() => handleSendOutreachCampaign(selectedCandidate.id)}
                  disabled={!outreachDraftText}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>Queue Outreach and Schedule Sequence</span>
                </button>
              </div>

              {selectedCandidate.outreachStatus === 'Outreach Sent' && (
                <div className="bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl p-3.5 text-xs font-semibold leading-relaxed flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Outreach has been dispatched. Status switched to <strong>Outreach Sent</strong>. Follow-up automated checker cron has been scheduled.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 2. "EDIT SPEC" INGEST SELECTION AND GEMINI ANALYSIS OVERLAY MODAL */}
      {isSpecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsSpecModalOpen(false)} />
          
          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl z-30 flex flex-col max-h-[90vh] overflow-hidden border">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-none">
                    Job Specification Ingest & Keywords Analyzer Console
                  </h3>
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Upload your recruitment raw contract scope details. Gemini extracts structural criteria & auto-sourcing targets.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSpecModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white cursor-pointer px-3 transition"
              >
                Close Spec Ingest
              </button>
            </div>

            {/* Ingest Body Panel */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <JobSpecSection
                onAnalyzeComplete={handleSpecProcessed}
                onAddLog={addLog}
              />
            </div>

            {/* Ingest Footer */}
            <div className="bg-white border-t p-4 flex justify-between items-center text-[11px] text-slate-400 shrink-0">
              <span>Model reference: <strong>Gemini-3.5-flash-preview</strong> (JSON Schema constraint mode active)</span>
              <span className="text-slate-500 font-bold">TalentFlow AI Core Engine</span>
            </div>

          </div>
        </div>
      )}

      {/* 3. DEVELOPER COCKPIT SPEC BLUEPRINTS MODAL */}
      {isDevHubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDevHubOpen(false)} />
          
          {/* Modal Container */}
          <div className="relative bg-[#0F172A] w-full max-w-4xl rounded-3xl shadow-2xl z-30 flex flex-col max-h-[90vh] overflow-hidden text-slate-300 border border-slate-800">
            
            {/* Direct Header */}
            <div className="bg-[#1E293B] p-5 flex items-center justify-between border-b border-slate-800 shrink-0 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-none">Development blueprints & Schematics Hub</h3>
                  <p className="text-xs text-slate-400 mt-1">API endpoints recipes, PostgreSQL relational structures, Cron alerts scheduling patterns.</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsDevHubOpen(false)}
                className="p-1 px-3 hover:bg-slate-700 bg-slate-850 font-sans font-extrabold text-xs text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
              >
                Exit blueprints
              </button>
            </div>

            {/* Blueprint Contents Area */}
            <div className="p-6 overflow-y-auto flex-1 font-sans space-y-6">
              
              {/* Architecture sequence diagram */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest leading-none">1. Event pipeline diagram schemas:</h4>
                <p className="text-xs text-slate-300 leading-normal">The candidate lookup, matches profiling, and no-response tracking sequences are handled via the following server-side process workflow:</p>
                
                <pre className="text-[10.5px] text-indigo-200 font-mono bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-4.5 overflow-x-auto leading-normal">
{`   [Ingest specification] -> (Gemini 3.5 Flash BTP parser)
                                 |  
                                 v  
                  [alternate Recruiters Keywords & platforms paths validated]
                                 |  
                                 v  
             (Background search routines - Apollo API & LinkedIn scrapers)
                                 |  
                                 v  
           [Private Emails discovered & assigned with (E / P) health indicators]
                                 |  
                                 v  
            (Outbox sequences drafted to prospect contact coordinates)
                                 |  
                                 v  
           (Cron scheduled background worker identifies non-response - triggers Alert)`}
                </pre>
              </div>

              {/* API Endpoints description and Database Schema Mapping */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                
                {/* Postgres Schema mapping table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">2. Relational Postgres tables structure:</h4>
                  <pre className="text-[10px] text-indigo-100 font-mono bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 leading-tight">
{`CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) CHECK (platform IN ('LinkedIn', 'Upwork', 'Reddit')),
  match_score DECIMAL(3,1) CHECK (match_score BETWEEN 0 AND 10),
  open_to_work BOOLEAN DEFAULT false,
  email_address VARCHAR(255),
  phone_coordinate VARCHAR(50),
  outreach_status VARCHAR(50) DEFAULT 'Sourced',
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  alert_triggered BOOLEAN DEFAULT false
);`}
                  </pre>
                </div>

                {/* API Request schema */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-[#34D399] uppercase tracking-widest">3. Cron Schedulers logic (No Response Tracker):</h4>
                  <pre className="text-[10px] text-emerald-200 font-mono bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 leading-tight">
{`// Scheduled alert checker (daily 8 AM)
import cron from 'node-cron';

cron.schedule('0 8 * * *', async () => {
  const silentProspects = await db.query(\`
    SELECT * FROM candidates 
    WHERE outreach_status = 'Outreach Sent'
      AND last_activity_at < NOW() - INTERVAL '48 hours'
      AND alert_triggered = false
  \`);

  for (const prospect of silentProspects.rows) {
    await triggerRecruiterWebhookAlert(prospect);
    await db.query(\`
      UPDATE candidates 
      SET alert_triggered = true 
      WHERE id = $1
    \`, [prospect.id]);
  }
});`}
                  </pre>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. DATA ENRICHMENT CONFIGURATION MODAL (BULK APOLLO SETTINGS) */}
      {isEnrichCreditsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsEnrichCreditsOpen(false)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl z-30 p-6 space-y-4 border">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Apollo.io Bulk Lookup & Enrichment Hub</h3>
              <p className="text-slate-400 text-xs mt-0.5">Control API parameters, buy/simulate refills, and perform batch matching.</p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="bg-slate-50 rounded-xl p-3.5 border text-xs text-slate-700 space-y-1">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Current API Limit:</span>
                  <span>10,000 requests/mo</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Remaining Credits:</span>
                  <span>{enrichmentCredits} of 200</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Simulated Scrapers State:</span>
                  <span className="text-emerald-600">Active Handshake</span>
                </div>
              </div>

              {/* Simulated buy limits */}
              <button
                onClick={() => {
                  setEnrichmentCredits(200);
                  addLog('Purchased credit pack. Enrichment quota topped up back to 200 credits.', 'enrich');
                  setIsEnrichCreditsOpen(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition shadow-sm text-center"
              >
                Top up / Refill Quota back to 200 Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EXPORT OPTIONS DIALOG BOX */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsExportModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl z-30 p-6 space-y-4 border">
            <div className="space-y-1">
              <h3 className="font-extrabold text-[#111827] text-base flex items-center gap-1.5 leading-none">
                <Download className="w-4.5 h-4.5 text-indigo-600" />
                Export candidate package
              </h3>
              <p className="text-slate-400 text-xs">
                Export and download highly structured profiles matching campaign parameters.
              </p>
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10.5px] text-indigo-900 leading-relaxed font-semibold">
              Ready to ship: downloading registers compiled in CSV alignment columns including verified personal emails, scores, and active credentials discovered online.
            </div>

            <button
              onClick={handleTriggerCsvExport}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer shadow-md text-center transition flex justify-center items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel/CSV Records ({filteredCandidates.length} Rows)</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. INTERACTIVE telephony OUTBOX CELL-CALL DIALOG SUMMARY */}
      {isCallingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" />
          
          <div className="relative bg-[#0F172A] w-full max-w-sm rounded-3xl shadow-2xl z-30 p-6 text-white text-center space-y-5 border border-slate-800">
            
            {/* Visual Phone dial mock */}
            <div className="space-y-2 pt-2">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto text-white shadow-lg animate-bounce duration-1000">
                <Phone className="w-7 h-7 fill-white" />
              </div>
              <h4 className="font-extrabold font-sans text-base text-white">Telephony Dial Active...</h4>
              <p className="text-xs text-slate-400 font-semibold leading-none mt-1">
                Calling prospect: {isCallingCandidate.name}
              </p>
              <p className="font-mono text-sm text-indigo-400 font-extrabold">+44 7911 391482</p>
            </div>

            {/* Simulated note composers and outcomes */}
            <div className="space-y-3.5 text-left border-t border-slate-800 pt-4">
              <label className="text-[9.5px] font-mono font-bold uppercase text-slate-500">Call Resolution Select:</label>
              
              <div className="grid grid-cols-2 gap-2 text-[10.5px] font-sans font-extrabold font-semibold">
                <button
                  onClick={() => handleLogCallSuccess("Interview Booked", "Recruiter dialed and reached candidate. Sarah is incredibly keen to modern integration, requested scheduled tech alignment for next Monday!")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 text-center rounded-xl cursor-pointer transition shadow-xs"
                >
                  Booked Interview
                </button>
                <button
                  onClick={() => handleLogCallSuccess("Left Voicemail", "Sourced voicemail outbox. Recruiter left standardized invitation details for direct callback.")}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-2 text-center rounded-xl cursor-pointer transition"
                >
                  Left Voicemail
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-bold uppercase text-slate-400">Call logs context details:</label>
                <textarea
                  placeholder="Type manual recruiter notes..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sans"
                />
              </div>
            </div>

            <button
              onClick={() => setIsCallingCandidate(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
            >
              Cancel VoIP Stream call
            </button>

          </div>
        </div>
      )}

      {/* 7. INTERACTIVE messenger RESPONDER OUTBOX SYSTEM */}
      {isViewingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsViewingMessage(null)} />
          
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl z-30 p-5 space-y-4 border flex flex-col max-h-[90vh]">
            
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Thread: {isViewingMessage.name}</h3>
                  <p className="text-[9.5px] text-slate-400 leading-none mt-0.5">Channel: <strong>{isViewingMessage.channel}</strong></p>
                </div>
              </div>
              <button 
                onClick={() => setIsViewingMessage(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Close Thread
              </button>
            </div>

            {/* Incoming message box */}
            <div className="space-y-3.5">
              
              <div className="bg-slate-50 border rounded-xl p-3.5 text-xs text-slate-700 font-sans leading-relaxed relative border-l-4 border-indigo-500">
                <div className="text-[10px] font-mono uppercase text-indigo-600 font-bold mb-1">{isViewingMessage.name}:</div>
                &quot;{isViewingMessage.message}&quot;
              </div>

              {/* Responder tools */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-400 font-bold">
                  <span>AISuggest Response helper:</span>
                  <button
                    onClick={handleGenerateAISuggestion}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    disabled={isViewingMessage.loadingSuggestion}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                    <span>{isViewingMessage.loadingSuggestion ? 'Thinking...' : 'Suggest draft professional reply'}</span>
                  </button>
                </div>

                {isViewingMessage.suggestionDraft ? (
                  <textarea
                    value={isViewingMessage.suggestionDraft}
                    onChange={(e) => setIsViewingMessage(prev => prev ? { ...prev, suggestionDraft: e.target.value } : null)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed edit-input"
                  />
                ) : (
                  <div className="bg-slate-50 border rounded-xl p-6 text-center text-slate-400 text-xs font-sans italic">
                    Use Gemini Smart reply suggestion tool to compose response with calendar proposals.
                  </div>
                )}
              </div>

              {/* Actions dispatch */}
              <button
                onClick={handleSendResponseSuccess}
                disabled={!isViewingMessage.suggestionDraft}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md text-center transition flex justify-center items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>Send Professional Reply Sequence</span>
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
