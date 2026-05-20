/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy-initialize GoogleGenAI for safety, handles missing keys gracefully
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// Global state trackers for matching simulated responses (in case of missing key or safety)
const fallbackJobAnalyses: Record<string, any> = {
  sap: {
    title: "Senior SAP Integration Architect",
    alternateTitles: ["SAP CPI Consultant", "SAP Cloud Integration Developer", "ABAP Web Services Architect"],
    extractedKeywords: ["SAP CPI", "ABAP", "SAP BTP", "RFC", "OAuth", "Core Data Services (CDS)", "REST API"],
    requirements: [
      "Over 8 years experience in SAP ABAP and integration solutions",
      "Designing end-to-end integration flows using SAP Cloud Platform Integration (CPI)",
      "Troubleshooting complex web service connections (REST, SOAP, RFC, IDoc)",
      "Strong understanding of SAP BTP platform capabilities and B2B/A2A scenarios"
    ],
    preferredPlatforms: ["LinkedIn", "Upwork"]
  },
  azure: {
    title: "Lead Azure Infrastructure Engineer",
    alternateTitles: ["Azure Cloud Solution Architect", "Senior DevSecOps Azure Engineer", "AKS Specialist"],
    extractedKeywords: ["Terraform", "Azure Kubernetes Service (AKS)", "Entra ID", "Azure DevOps", "CI/CD Pipelines", "ARM Templates"],
    requirements: [
      "Extensive experience deploying Azure enterprise infrastructure using Terraform",
      "Managing production clusters in Azure Kubernetes Service (AKS)",
      "Configuring access management and security using Microsoft Entra ID",
      "Building robust continuous deployment pipelines in Azure DevOps"
    ],
    preferredPlatforms: ["LinkedIn", "Reddit"]
  },
  devops: {
    title: "Senior Specialist DevOps Engineer",
    alternateTitles: ["Platform Reliability Architect", "Senior DevOps Cloud Architect", "SRE Kubernetes Expert"],
    extractedKeywords: ["Kubernetes", "AWS Cloud", "Prometheus", "Grafana", "GitHub Actions", "Docker", "Terraform Engine"],
    requirements: [
      "Designing multi-cluster Kubernetes topologies on AWS (EKS)",
      "Full infrastructure authorization using Terraform scripts",
      "Setting up comprehensive cluster telemetry with Prometheus & Grafana alerts",
      "Securing automation deployment workflows via GitHub Actions runner"
    ],
    preferredPlatforms: ["LinkedIn", "Reddit", "Upwork"]
  }
};

const fallbackCandidates: Record<string, any[]> = {
  sap: [
    {
      id: "candidate-1",
      name: "Marcus Vance",
      currentTitle: "SAP CPI & integration Architect",
      company: "Synthesys Enterprise Solutions",
      bio: "Highly specialized SAP Architect passionate about modern hybrid cloud integrations. Over 10 years automating workflows using SAP BTP, CPI, and CDS View optimization.",
      openToWork: true,
      platform: "LinkedIn",
      matchScore: 9.8,
      matchExplanation: "Exceptional technical expertise in SAP Cloud Integration and custom ABAP solutions. Possesses an active Open-To-Work frame and exact matches for all requested SAP CPI keywords.",
      skills: ["SAP CPI", "ABAP", "SAP BTP", "CDS Views", "OAuth 2.0", "Cloud Connector", "REST API"],
      strengths: ["10+ years SAP environment background", "Core SAP BTP administration certified", "Proficient in high-throughput enterprise connections"],
      gaps: ["Has worked primarily in Europe (may require remote adjustment for NA clients)"]
    },
    {
      id: "candidate-2",
      name: "Sriya Patnaik",
      currentTitle: "SAP Integration Consultant",
      company: "Apex Tech Consulting",
      bio: "Agile developer focused on SAP CPI, API Management, and RFC interface transformations. Experienced in delivering on-time migrations for Fortune 500 logistics players.",
      openToWork: true,
      platform: "Upwork",
      matchScore: 9.3,
      matchExplanation: "Superb alignment with integration specs. Highly proficient in SAP BTP CPI. Lacks extensive older ABAP custom coding, but has extensive modern cloud interface skills.",
      skills: ["SAP CPI", "Varying Web Services", "SAP BTP", "JSON Map transformations", "API Gateway"],
      strengths: ["Excellent freelance track record with impeccable reviews", "Highly responsive and agile communicator", "Fast deliverer on interface configurations"],
      gaps: ["Lower experience with vintage ABAP system customizations"]
    },
    {
      id: "candidate-3",
      name: "Thomas Mueller",
      currentTitle: "Fullstack ABAP & CPI Developer",
      company: "Bavaria Logistics Group",
      bio: "Pragmatic Swiss engineer blending old-school ABAP CDS performance tuning with modern CPI REST adapters. Strong background in supply chain workflows.",
      openToWork: false,
      platform: "LinkedIn",
      matchScore: 8.9,
      matchExplanation: "Outstanding technical depth matches but is not currently looking active ('Open to Work' is off), which increases engagement friction and likely cost-per-hire.",
      skills: ["ABAP", "SAP CPI", "RFC integrations", "IDocs troubleshooting", "SAP Cloud Connector"],
      strengths: ["Strong technical coupling with manufacturing & logistics systems", "Mastery of backend security certificates and OAuth handshakes"],
      gaps: ["Not proactively looking for new opportunities at this moment"]
    }
  ],
  azure: [
    {
      id: "candidate-4",
      name: "Clara Zhang",
      currentTitle: "Senior Azure Cloud Architect",
      company: "Omnicell Technologies",
      bio: "Architecting zero-trust cloud infrastructures. Infrastructure as Code (IaC) advocate with 200+ Terraform modules deployed in production Azure subscriptions.",
      openToWork: true,
      platform: "LinkedIn",
      matchScore: 9.7,
      matchExplanation: "Flawless score across Terraform IaC, AKS clustering, and Entra ID integration. Currently open to exploring new remote-first lead engineer challenges.",
      skills: ["Terraform", "Azure Kubernetes Service (AKS)", "Entra ID", "Azure DevOps", "CI/CD", "Security Baseline"],
      strengths: ["Excellent team leader and clear presenter", "In depth cybersecurity Entra ID policies knowledge", "Production scale Kubernetes deployment record"],
      gaps: ["Expected compensation is at the very top of typical market budgets"]
    },
    {
      id: "candidate-5",
      name: "Devon Miller",
      currentTitle: "Freelance DevOps Engineer",
      company: "CloudBound Solutions (Contractor)",
      bio: "An Azure DevOps pipelines creator and AKS custom cluster troubleshooter. I assist SaaS startups in scaling and securing their cloud infrastructure safely.",
      openToWork: true,
      platform: "Upwork",
      matchScore: 9.4,
      matchExplanation: "Perfect fit for targeted infrastructure requirements. Solid portfolio showcasing Terraform automation for startup AKS configurations.",
      skills: ["Terraform", "Azure Kubernetes Service (AKS)", "Azure DevOps pipelines", "Dockerization"],
      strengths: ["Immediately available to commence contract projects", "Excellent automation developer", "Hands-on diagnostic capabilities"],
      gaps: ["Lacks formal enterprise-scale governance certifications"]
    },
    {
      id: "candidate-6",
      name: "u/CloudSurferAzure",
      currentTitle: "Systems Platform Administrator",
      company: "Local MSP Agency",
      bio: "Redditor and active Azure contributor. Frequently posting templates on r/azure and r/devops. Specializing in Microsoft Entra identity syncs and Terraform hacks.",
      openToWork: true,
      platform: "Reddit",
      matchScore: 8.4,
      matchExplanation: "High tech aptitude and very proactive problem solver. Less structured formal agency documentation background, but immensely competent on Terraform.",
      skills: ["Terraform", "Entra ID", "Scripting", "AKS Clusters", "Azure CLI"],
      strengths: ["Active member of developer communities", "Extremely passion-driven developer", "Unconventional debugger skills"],
      gaps: ["Fewer traditional corporate references in direct enterprise roles"]
    }
  ],
  devops: [
    {
      id: "candidate-7",
      name: "Elena Rostova",
      currentTitle: "Staff DevOps Engineer (EKS)",
      company: "DataVibe Analytics",
      bio: "Kubernetes nerd focusing on metrics monitoring, load-balancing, and automated recovery loops. AWS Cloud Specialist overseeing 1000+ active microservices.",
      openToWork: true,
      platform: "LinkedIn",
      matchScore: 9.9,
      matchExplanation: "Spectacular match. Staff level expertise spanning Prometheus/Grafana and AWS EKS topologies. Has the 'Open to Work' ring on her LinkedIn profile picture.",
      skills: ["Kubernetes", "AWS Cloud", "Prometheus", "Grafana", "GitHub Actions", "Docker", "Terraform Engine"],
      strengths: ["High familiarity with web-scale microservice limits", "Passionate mentor who establishes robust alerting triggers", "Extensive experience with continuous delivery pipelines"],
      gaps: ["Requires standard 4-week notice period before onboarding"]
    }
  ]
};

// --- API ENDPOINT: HEALTH ---
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- API ENDPOINT: ANALYZE JOB SPEC ---
app.post('/api/analyze-job-spec', async (req: Request, res: Response) => {
  const { jobText } = req.body;
  if (!jobText || jobText.trim() === '') {
    return res.status(400).json({ error: "Job specification text is required." });
  }

  const ai = getGenAI();
  if (!ai) {
    // If no API Key is set, analyze text simply to find fallback category or use dynamic simulation
    console.log("No Gemini API key. Using adaptive mock search matching rules.");
    let matchedCategory = "sap";
    const lowerText = jobText.toLowerCase();
    if (lowerText.includes("azure") || lowerText.includes("entra") || lowerText.includes("microsoft")) {
      matchedCategory = "azure";
    } else if (lowerText.includes("devops") || lowerText.includes("aws") || lowerText.includes("kubernetes")) {
      matchedCategory = "devops";
    }

    const matchedAnalysis = { ...fallbackJobAnalyses[matchedCategory] };
    matchedAnalysis.title = `Extracted: ${matchedAnalysis.title}`;
    // Simulate slight modification to look dynamic
    return res.json({
      success: true,
      analysis: matchedAnalysis,
      isSimulated: true
    });
  }

  try {
    const prompt = `Analyze the following job description text and extract structured recruitment keywords and queries. Keep it highly practical.
    
    Job Description:
    """
    ${jobText}
    """
    
    Generate exactly the fields defined in the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert recruitment system AI. Analyze the corporate job specification and extract matching titles, key tech keywords, requirements list, and optimal candidate source pathways.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The overarching primary role title extracted from the spec." },
            alternateTitles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 to 3 absolute closest alternative titles recruiters use on LinkedIn to look for this candidate."
            },
            extractedKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5 to 8 hyper-specific tech stacks, languages, systems or skills keywords (e.g. 'SAP CPI', 'Terraform')."
            },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 4 core actionable qualifications or tasks the candidate must fulfill."
            },
            preferredPlatforms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The top platform options matching this profile, return a subset of ['LinkedIn', 'Upwork', 'Reddit']."
            }
          },
          required: ["title", "alternateTitles", "extractedKeywords", "requirements", "preferredPlatforms"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No text returned from Gemini API");
    }

    const parsed = JSON.parse(responseText.trim());
    return res.json({
      success: true,
      analysis: parsed,
      isSimulated: false
    });
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error);
    return res.status(500).json({
      error: "Error processing job description via Gemini API",
      message: error.message || String(error)
    });
  }
});

// --- API ENDPOINT: SOURCE CANDIDATES DYNAMICALLY ---
app.post('/api/source-candidates', async (req: Request, res: Response) => {
  const { title, alternateTitles, extractedKeywords, requirements } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Missing required job spec parameters to source candidates." });
  }

  const ai = getGenAI();
  if (!ai) {
    console.log("No Gemini API key for sourcing. Returning realistic matched candidates.");
    // Fallback matching
    let matchedKey = "sap";
    const titleLower = title.toLowerCase();
    if (titleLower.includes("azure") || titleLower.includes("cloud") || titleLower.includes("infrastructure")) {
      matchedKey = "azure";
    } else if (titleLower.includes("devops") || titleLower.includes("kubernetes") || titleLower.includes("sre")) {
      matchedKey = "devops";
    }

    const candidates = fallbackCandidates[matchedKey] || fallbackCandidates.sap;
    return res.json({
      success: true,
      candidates,
      isSimulated: true
    });
  }

  try {
    const prompt = `Based on the job title "${title}", alternative titles: [${(alternateTitles || []).join(', ')}], skills: [${(extractedKeywords || []).join(', ')}], and requirements: [${(requirements || []).join(', ')}], generate 4 realistic, diverse, high-fidelity candidate profiles that a recruiter might scrape from LinkedIn, Upwork, or Reddit.
    
    Make sure:
    - At least 2 candidates are from 'LinkedIn', others from 'Upwork' or 'Reddit'.
    - At least 2 candidate profiles MUST have openToWork set to true (mimicking the LinkedIn Open to Work frame).
    - Give them unique, realistic-sounding English or international names.
    - Match scores (between 1 and 10) should be graded carefully against the requirements (e.g., 9.8 for a perfect fit, 8.4 for partial, etc.). Ensure there is at least one candidate with a score above 9.5 (extremely fit candidate!).
    - Skills, strengths, and gaps must align with their individual bio and matching level.
    - Keep bios professional but personalized.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an elite candidate matching simulation model. Generate highly believable, visually-descriptive professional profile snapshots across LinkedIn, Upwork, and Reddit matching specified job parameters.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidates: {
              type: Type.ARRAY,
              description: "Array of generated matching candidates.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Full name of the candidate." },
                  currentTitle: { type: Type.STRING, description: "Their current job title." },
                  company: { type: Type.STRING, description: "Current employing company or contractor status." },
                  bio: { type: Type.STRING, description: "A realistic 2-sentence bio overview." },
                  openToWork: { type: Type.BOOLEAN, description: "True if the candidate is looking and has the 'Open to Work' status active." },
                  platform: { type: Type.STRING, description: "Origin platform: Must be exactly 'LinkedIn', 'Upwork' or 'Reddit'." },
                  matchScore: { type: Type.NUMBER, description: "Dynamic ranking rating out of 10.0 against the job spec. Ensure high precision." },
                  matchExplanation: { type: Type.STRING, description: "One sentence explain of why this candidate was scored as such." },
                  skills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of 5 to 7 skills they possess."
                  },
                  strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 quick core professional strengths."
                  },
                  gaps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "1 to 2 gaps relative to the job spec."
                  }
                },
                required: ["name", "currentTitle", "company", "bio", "openToWork", "platform", "matchScore", "matchExplanation", "skills", "strengths", "gaps"]
              }
            }
          },
          required: ["candidates"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No candidates returned from Gemini API");
    }

    const parsed = JSON.parse(responseText.trim());
    
    // Inject custom ID and default fields into generated profiles
    const enhancedCandidates = parsed.candidates.map((c: any, index: number) => ({
      ...c,
      id: `candidate-dynamic-${Date.now()}-${index}`,
    }));

    return res.json({
      success: true,
      candidates: enhancedCandidates,
      isSimulated: false
    });
  } catch (error: any) {
    console.error("Gemini Candidate Sourcing Error:", error);
    return res.status(500).json({
      error: "Error sourcing matching candidates via Gemini API",
      message: error.message || String(error)
    });
  }
});

// --- API ENDPOINT: GENERATE PERSONALIZED OUTREACH MESSAGE ---
app.post('/api/generate-message', async (req: Request, res: Response) => {
  const { candidate, originalSpec } = req.body;
  if (!candidate || !originalSpec) {
    return res.status(400).json({ error: "Missing candidate info or original spec text to draft message." });
  }

  const ai = getGenAI();
  if (!ai) {
    console.log("No Gemini API key for campaign. Compiling simulation message.");
    const customMessage = `Hi ${candidate.name},

I saw your impressive profile on ${candidate.platform} and noticed your stellar experience in ${candidate.skills.slice(0, 3).join(', ')}. Your background at ${candidate.company} as a "${candidate.currentTitle}" stood out immediately, especially checkmark credentials in ${candidate.skills[0] || 'your core domain'}.

We are currently sourcing a Lead position matching your spec profile. Based on your impressive ${candidate.matchScore}/10 matching architecture score, we'd love to connect for a brief 10-minute call this Thursday or Friday.

Let me know if you are open to discuss,
Recruiter Agent Outreach Sync`;

    return res.json({
      success: true,
      message: customMessage,
      isSimulated: true
    });
  }

  try {
    const prompt = `Produce a highly personalized, compelling, modern multichannel recruitment outreach message for candidate "${candidate.name}". Target score: ${candidate.matchScore}/10. 
    
    Candidate Snapshot:
    - Current Title: ${candidate.currentTitle}
    - Company: ${candidate.company}
    - Platform Found: ${candidate.platform}
    - Primary Skills: ${(candidate.skills || []).join(', ')}
    - Main Strengths: ${(candidate.strengths || []).join(', ')}
    
    Original Job Spec Context:
    """
    ${originalSpec}
    """
    
    Draft a concise, warm, professional message suited for direct messaging or cold email outreach. Speak in direct human terms. Make it reference their direct work profile details. Do not use generic corporate language. Ask a clear conversation-starter question at the end. Keep it under 150 words. Do not output variables or brackets.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a master of personal sales and recruiter messaging. Write a high-converting, personalized candidate outreach communication that feels authentic and avoids standard recruiting clichés."
      }
    });

    const responseText = response.text || '';
    return res.json({
      success: true,
      message: responseText.trim(),
      isSimulated: false
    });
  } catch (error: any) {
    console.error("Gemini Outreach Error:", error);
    return res.status(500).json({
      error: "Error generating personalized outreach via Gemini API",
      message: error.message || String(error)
    });
  }
});


// Load client assets dynamically via Vite in Dev, or serve standard React static client build in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Sourcing & Outreach App running on port http://localhost:${PORT}`);
  });
}

startServer();
