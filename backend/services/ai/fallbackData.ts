import type { JobAnalysis } from '../../types/jobSpec.types';
import type { RawCandidateProfile } from '../../types/candidate.types';

// Static mock data used when GEMINI_API_KEY is absent (dev/demo mode)

export const fallbackAnalyses: Record<string, JobAnalysis> = {
  sap: {
    title: 'Senior SAP Integration Architect',
    alternateTitles: ['SAP CPI Consultant', 'SAP Cloud Integration Developer', 'ABAP Web Services Architect'],
    extractedKeywords: ['SAP CPI', 'ABAP', 'SAP BTP', 'RFC', 'OAuth', 'CDS Views', 'REST API'],
    requirements: [
      'Over 8 years experience in SAP ABAP and integration solutions',
      'Designing end-to-end integration flows using SAP Cloud Platform Integration (CPI)',
      'Troubleshooting complex web service connections (REST, SOAP, RFC, IDoc)',
      'Strong understanding of SAP BTP platform capabilities and B2B/A2A scenarios',
    ],
    preferredPlatforms: ['LinkedIn', 'Upwork'],
  },
  azure: {
    title: 'Lead Azure Infrastructure Engineer',
    alternateTitles: ['Azure Cloud Solution Architect', 'Senior DevSecOps Azure Engineer', 'AKS Specialist'],
    extractedKeywords: ['Terraform', 'Azure Kubernetes Service (AKS)', 'Entra ID', 'Azure DevOps', 'CI/CD Pipelines', 'ARM Templates'],
    requirements: [
      'Extensive experience deploying Azure enterprise infrastructure using Terraform',
      'Managing production clusters in Azure Kubernetes Service (AKS)',
      'Configuring access management and security using Microsoft Entra ID',
      'Building robust continuous deployment pipelines in Azure DevOps',
    ],
    preferredPlatforms: ['LinkedIn', 'Reddit'],
  },
  devops: {
    title: 'Senior Specialist DevOps Engineer',
    alternateTitles: ['Platform Reliability Architect', 'Senior DevOps Cloud Architect', 'SRE Kubernetes Expert'],
    extractedKeywords: ['Kubernetes', 'AWS Cloud', 'Prometheus', 'Grafana', 'GitHub Actions', 'Docker', 'Terraform'],
    requirements: [
      'Designing multi-cluster Kubernetes topologies on AWS (EKS)',
      'Full infrastructure provisioning using Terraform',
      'Setting up cluster telemetry with Prometheus & Grafana alerts',
      'Securing automation workflows via GitHub Actions',
    ],
    preferredPlatforms: ['LinkedIn', 'Reddit', 'Upwork'],
  },
};

export const fallbackCandidates: Record<string, RawCandidateProfile[]> = {
  sap: [
    {
      name: 'Marcus Vance',
      currentTitle: 'SAP CPI & Integration Architect',
      company: 'Synthesys Enterprise Solutions',
      bio: 'Highly specialized SAP Architect with 10+ years automating workflows using SAP BTP, CPI, and CDS Views.',
      openToWork: true,
      platform: 'LinkedIn',
      matchScore: 9.8,
      matchExplanation: 'Exact keyword matches for SAP CPI, BTP, and ABAP with active Open-to-Work status.',
      skills: ['SAP CPI', 'ABAP', 'SAP BTP', 'CDS Views', 'OAuth 2.0', 'Cloud Connector', 'REST API'],
      strengths: ['10+ years SAP background', 'BTP administration certified', 'High-throughput integration design'],
      gaps: ['Primarily European client base'],
    },
    {
      name: 'Sriya Patnaik',
      currentTitle: 'SAP Integration Consultant',
      company: 'Apex Tech Consulting',
      bio: 'Agile SAP CPI developer delivering Fortune 500 logistics migrations on Upwork with 5-star reviews.',
      openToWork: true,
      platform: 'Upwork',
      matchScore: 9.3,
      matchExplanation: 'Strong cloud interface skills; limited legacy ABAP depth.',
      skills: ['SAP CPI', 'Web Services', 'SAP BTP', 'JSON Mapping', 'API Gateway'],
      strengths: ['Excellent contractor track record', 'Fast delivery on integrations'],
      gaps: ['Lower experience with vintage ABAP customizations'],
    },
  ],
  azure: [
    {
      name: 'Clara Zhang',
      currentTitle: 'Senior Azure Cloud Architect',
      company: 'Omnicell Technologies',
      bio: 'Zero-trust infrastructure advocate. 200+ Terraform modules deployed across Azure enterprise subscriptions.',
      openToWork: true,
      platform: 'LinkedIn',
      matchScore: 9.7,
      matchExplanation: 'Perfect score across Terraform, AKS, and Entra ID with open-to-work status.',
      skills: ['Terraform', 'Azure Kubernetes Service', 'Entra ID', 'Azure DevOps', 'CI/CD', 'Security Baseline'],
      strengths: ['Team leadership', 'Deep cybersecurity knowledge', 'Production-scale Kubernetes'],
      gaps: ['Compensation at top of market range'],
    },
  ],
  devops: [
    {
      name: 'Elena Rostova',
      currentTitle: 'Staff DevOps Engineer (EKS)',
      company: 'DataVibe Analytics',
      bio: 'Kubernetes specialist overseeing 1000+ microservices on AWS EKS with full Prometheus/Grafana observability stack.',
      openToWork: true,
      platform: 'LinkedIn',
      matchScore: 9.9,
      matchExplanation: 'Staff-level expertise spanning all required tools. Open-to-Work on LinkedIn.',
      skills: ['Kubernetes', 'AWS EKS', 'Prometheus', 'Grafana', 'GitHub Actions', 'Docker', 'Terraform'],
      strengths: ['Web-scale microservice experience', 'Observability expertise', 'Continuous delivery pipelines'],
      gaps: ['Requires 4-week notice period'],
    },
  ],
};

export function detectCategory(text: string): keyof typeof fallbackAnalyses {
  const lower = text.toLowerCase();
  if (lower.includes('azure') || lower.includes('entra') || lower.includes('microsoft')) return 'azure';
  if (lower.includes('devops') || lower.includes('aws') || lower.includes('kubernetes')) return 'devops';
  return 'sap';
}
