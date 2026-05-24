import type { Candidate } from '../types';

export interface Campaign {
  id: string;
  name: string;
  jobTitle: string;
  location: string;
  jobType: string;
  department: string;
  status: 'running' | 'paused' | 'draft';
  code?: string;
  stats: { identified: number; enriched: number; outreachSent: number };
  channelMix: { label: string; pct: number; color: string }[];
}

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'sap',
    name: 'SAP Architect',
    jobTitle: 'Senior SAP Architect',
    location: 'London, UK',
    jobType: 'Full-time',
    department: 'Tech & Strategy',
    status: 'running',
    stats: { identified: 1420, enriched: 892, outreachSent: 345 },
    channelMix: [
      { label: 'LinkedIn Search', pct: 62, color: 'bg-blue-500' },
      { label: 'Upwork Pro', pct: 24, color: 'bg-indigo-500' },
      { label: 'Reddit Communities', pct: 14, color: 'bg-orange-500' },
    ],
  },
  {
    id: 'azure',
    name: 'Azure Engineer',
    jobTitle: 'Lead Azure Infrastructure Engineer',
    location: 'Remote, EU',
    jobType: 'Contract',
    department: 'Platform Engineering',
    status: 'paused',
    code: 'NAK0XD',
    stats: { identified: 830, enriched: 411, outreachSent: 178 },
    channelMix: [
      { label: 'LinkedIn Search', pct: 70, color: 'bg-blue-500' },
      { label: 'Reddit Communities', pct: 20, color: 'bg-orange-500' },
      { label: 'Upwork Pro', pct: 10, color: 'bg-indigo-500' },
    ],
  },
  {
    id: 'devops',
    name: 'Principal DevOps',
    jobTitle: 'Principal DevOps Engineer',
    location: 'New York, US',
    jobType: 'Full-time',
    department: 'Infrastructure',
    status: 'draft',
    stats: { identified: 0, enriched: 0, outreachSent: 0 },
    channelMix: [
      { label: 'LinkedIn Search', pct: 55, color: 'bg-blue-500' },
      { label: 'Reddit Communities', pct: 30, color: 'bg-orange-500' },
      { label: 'Upwork Pro', pct: 15, color: 'bg-indigo-500' },
    ],
  },
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-sap-1',
    name: 'Sarah Jenkins',
    currentTitle: 'Lead SAP Architect',
    company: 'Generic',
    bio: 'Highly specialized SAP Architect with 10+ years automating custom SAP BTP CPI interface architectures.',
    openToWork: true,
    platform: 'LinkedIn',
    matchScore: 9.8,
    matchExplanation: 'Exceptional technical expertise in SAP Cloud Integration and custom ABAP solutions.',
    skills: ['SAP CPI', 'ABAP', 'SAP BTP', 'RFC', 'OAuth 2.0'],
    contact: { email: 'sarah.j@generic.com', phone: '+44 7911 123456', emailEnriched: true, phoneEnriched: true, linkedinUrl: 'https://linkedin.com/in/sarahjenkins' },
    outreachStatus: 'No Response',
    outreachMessage: '',
    outreachSentAt: new Date(Date.now() - 76 * 60 * 60 * 1000).toISOString(),
    daysSinceOutreach: 3,
    alertTriggered: true,
    strengths: ['10+ years SAP background', 'BTP certified'],
    gaps: ['Prefers London hybrid'],
  },
  {
    id: 'cand-sap-2',
    name: 'Markus Zhao',
    currentTitle: 'SAP Transformation Lead',
    company: 'HSBC',
    bio: 'Dedicated transformation leader overseeing legacy ABAP refactoring and ledger synchronizations.',
    openToWork: true,
    platform: 'LinkedIn',
    matchScore: 9.7,
    matchExplanation: 'Excellent compliance with core data pipeline objectives.',
    skills: ['SAP CPI', 'ABAP', 'OAuth 2.0', 'SAML SSO', 'REST API'],
    contact: { email: 'm.zhao@hsbc.com', phone: '', emailEnriched: true, phoneEnriched: false, linkedinUrl: 'https://linkedin.com/in/markuszhao' },
    outreachStatus: 'Outreach Sent',
    outreachMessage: '',
    outreachSentAt: new Date().toISOString(),
    daysSinceOutreach: 0,
    alertTriggered: false,
    strengths: ['Bank security pipelines', 'Web certificate mastery'],
    gaps: ['Above-market compensation'],
  },
  {
    id: 'cand-sap-3',
    name: 'Sriya Patnaik',
    currentTitle: 'SAP Integration Consultant',
    company: 'Apex Tech',
    bio: 'Agile freelancer focused on SAP CPI routing rules, mapping, and API Gateway transformations.',
    openToWork: true,
    platform: 'Upwork',
    matchScore: 9.6,
    matchExplanation: 'Superb alignment with integration specs.',
    skills: ['SAP CPI', 'REST API', 'SAP BTP', 'JSON Mapping'],
    contact: { email: '', phone: '', emailEnriched: false, phoneEnriched: false },
    outreachStatus: 'Sourced',
    daysSinceOutreach: 0,
    alertTriggered: false,
    strengths: ['Outstanding contractor rating'],
    gaps: ['Limited legacy ABAP experience'],
  },
  {
    id: 'cand-sap-4',
    name: 'Daniel Moore',
    currentTitle: 'Senior SAP Developer',
    company: 'CloudBridge Ltd',
    bio: 'Full-stack SAP developer with deep expertise in BTP extensions and API mesh patterns.',
    openToWork: true,
    platform: 'Upwork',
    matchScore: 9.5,
    matchExplanation: 'Strong BTP and API skills; recently replied to outreach.',
    skills: ['SAP BTP', 'ABAP', 'API Management', 'Node.js'],
    contact: { email: 'daniel@cloudbridge.io', phone: '+1 555 0192', emailEnriched: true, phoneEnriched: true },
    outreachStatus: 'Replied',
    outreachMessage: '',
    outreachSentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    daysSinceOutreach: 1,
    alertTriggered: false,
    strengths: ['Active Upwork Top Rated', 'Excellent communicator'],
    gaps: ['Timezone overlap needed'],
  },
];

export const MOCK_ALERTS = [
  {
    id: 'alert-1',
    type: 'no-response' as const,
    candidateName: 'Sarah Jenkins',
    message: "Sarah Jenkins hasn't replied to the initial email. Suggested action: Phone Call.",
    phone: '+44 7911 123456',
    pct: 48,
  },
  {
    id: 'alert-2',
    type: 'new-response' as const,
    candidateName: 'Daniel Moore',
    message: 'Daniel Moore replied via Upwork: "Interested in chatting Tuesday."',
    messageLink: '#',
  },
];
