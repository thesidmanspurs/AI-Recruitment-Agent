import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env';
import { GEMINI_MODEL } from '../../config/constants';
import type { JobAnalysis } from '../../types/jobSpec.types';
import type { RawCandidateProfile } from '../../types/candidate.types';

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!_client && env.GEMINI_API_KEY) {
    _client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return _client;
}

export const geminiService = {
  isAvailable(): boolean {
    return !!getClient();
  },

  async analyzeJobSpec(jobText: string): Promise<JobAnalysis> {
    const client = getClient();
    if (!client) throw new Error('Gemini client not initialised — check GEMINI_API_KEY');

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Analyze the following job description and extract structured recruitment data.\n\nJob Description:\n"""\n${jobText}\n"""`,
      config: {
        systemInstruction:
          'You are an expert recruitment AI. Analyze corporate job specifications and extract the primary role title, 2–4 closest alternative titles recruiters search on LinkedIn, 5–8 hyper-specific tech/skill keywords, 3–4 core actionable requirements the candidate must fulfil, and the top sourcing platforms from [LinkedIn, Upwork, Reddit].',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Primary role title extracted from the spec.',
            },
            alternateTitles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2–4 closest alternative titles recruiters use on LinkedIn.',
            },
            extractedKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '5–8 hyper-specific tech stacks, languages, or skill keywords.',
            },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3–4 core actionable qualifications the candidate must fulfil.',
            },
            preferredPlatforms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Subset of ['LinkedIn', 'Upwork', 'Reddit'] matching this profile.",
            },
          },
          required: ['title', 'alternateTitles', 'extractedKeywords', 'requirements', 'preferredPlatforms'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned empty response for job spec analysis');
    return JSON.parse(text.trim()) as JobAnalysis;
  },

  // Phase 2 — generate realistic candidate profiles from sourcing query
  async sourceCandidates(params: {
    title: string;
    alternateTitles: string[];
    extractedKeywords: string[];
    requirements: string[];
  }): Promise<RawCandidateProfile[]> {
    const client = getClient();
    if (!client) throw new Error('Gemini client not initialised — check GEMINI_API_KEY');

    const prompt = [
      `Simulate sourcing a candidate longlist for the following role.`,
      ``,
      `Primary title: ${params.title}`,
      `Alternate titles: ${params.alternateTitles.join(', ')}`,
      `Keywords: ${params.extractedKeywords.join(', ')}`,
      `Requirements:`,
      ...params.requirements.map(r => `  - ${r}`),
      ``,
      `Generate 8 plausible candidate profiles distributed across LinkedIn, Upwork, and Reddit.`,
      `Mix scores realistically: 3–4 profiles must score ≥9.5 (approved queue), the rest 7.5–9.4.`,
      `Score is a 0–10 float reflecting requirement fit, keyword density, and openToWork bias.`,
      `Names should be diverse and realistic. Companies should be plausible. Bios are 1–2 sentences.`,
      `matchExplanation must cite specific keyword/requirement hits.`,
    ].join('\n');

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an autonomous sourcing agent simulating LinkedIn / Upwork / Reddit candidate discovery. Return realistic, diverse, plausibly-named profiles with calibrated match scores. Never repeat names within a list.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              currentTitle: { type: Type.STRING },
              company: { type: Type.STRING },
              bio: { type: Type.STRING },
              openToWork: { type: Type.BOOLEAN },
              platform: { type: Type.STRING, enum: ['LinkedIn', 'Upwork', 'Reddit'] },
              matchScore: { type: Type.NUMBER },
              matchExplanation: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'name',
              'currentTitle',
              'company',
              'bio',
              'openToWork',
              'platform',
              'matchScore',
              'matchExplanation',
              'skills',
              'strengths',
              'gaps',
            ],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned empty response for candidate sourcing');

    const parsed = JSON.parse(text.trim()) as RawCandidateProfile[];

    // Defensive: clamp scores, normalise platform values
    return parsed.map(p => ({
      ...p,
      matchScore: Math.max(0, Math.min(10, Number(p.matchScore) || 0)),
      platform: (['LinkedIn', 'Upwork', 'Reddit'] as const).includes(p.platform)
        ? p.platform
        : 'LinkedIn',
    }));
  },

  // Phase 5 — generate personalised outreach message for a candidate.
  // Returns { subject, body } as plain strings; the caller can send via any
  // channel (email, LinkedIn DM, platform message).
  async generateOutreachMessage(params: {
    candidateName: string;
    candidateTitle: string;
    candidateCompany: string;
    candidateStrengths: string[];
    candidateBio?: string;
    jobTitle: string;
    jobKeywords: string[];
    jobLocation?: string | null;
    jobType?: string | null;
    jobRequirements?: string[];
    recruiterName?: string;
  }): Promise<{ subject: string; body: string }> {
    const client = getClient();
    if (!client) throw new Error('Gemini client not initialised — check GEMINI_API_KEY');

    // Few-shot exemplar (one of the recruiter-supplied gold examples).
    // Drives Gemini toward the right tone, paragraph count, length, and
    // sign-off discipline (no auto sign-off — signature is appended later).
    const exemplar = [
      `Subject: Oracle HFM Engineer Opportunity | Walmart to McLean/Richmond Project`,
      ``,
      `Hi Venkata,`,
      ``,
      `I was impressed by your extensive 18-year career in the EPM space, particularly your current role as a Senior Software Engineer at Walmart and your deep background in HFM and DRM architecture.`,
      ``,
      `I am currently recruiting for a 12-month Oracle Hyperion (HFM) Engineer contract that specifically seeks a hybrid professional—someone who understands the intricacies of HFM applications but operates with a modern engineering mindset. The project involves utilizing AWS and DevOps practices to modernize financial systems, which aligns well with your background in automation and system upgrades.`,
      ``,
      `Given your experience leading Hyperion upgrades and your technical certifications, I believe you would be a perfect fit for this engineering-heavy initiative in the McLean/Richmond area.`,
      ``,
      `Are you open to a brief conversation to discuss the technical scope and the hybrid model?`,
    ].join('\n');

    const prompt = [
      `Write a personalised recruiter outreach email in the EXACT structure shown in the exemplar below.`,
      ``,
      `── EXEMPLAR (style, length, and structure to copy) ──`,
      exemplar,
      `── END EXEMPLAR ──`,
      ``,
      `Now write a NEW email for THIS candidate and role:`,
      ``,
      `Candidate:`,
      `  Name: ${params.candidateName}`,
      `  Current role: ${params.candidateTitle} at ${params.candidateCompany}`,
      params.candidateBio ? `  Background: ${params.candidateBio.slice(0, 600)}` : '',
      params.candidateStrengths.length
        ? `  Notable strengths: ${params.candidateStrengths.slice(0, 5).join('; ')}`
        : '',
      ``,
      `Role:`,
      `  Title: ${params.jobTitle}`,
      params.jobLocation ? `  Location: ${params.jobLocation}` : '',
      params.jobType ? `  Employment type: ${params.jobType}` : '',
      `  Key tech / skills: ${params.jobKeywords.slice(0, 8).join(', ')}`,
      params.jobRequirements?.length
        ? `  Top requirements: ${params.jobRequirements.slice(0, 4).join('; ')}`
        : '',
      ``,
      `Hard requirements:`,
      `- 4 body paragraphs separated by BLANK LINES (two newline characters between paragraphs):`,
      `   1) Greeting on its own line (e.g. "Hi {firstName},"). Then blank line.`,
      `   2) Personal observation paragraph: reference a SPECIFIC detail about the candidate's background (years of experience, current company, a key skill from their strengths/background).`,
      `   3) Role pitch paragraph: name the role, location/employment type if provided, and 1-2 concrete role specifics (tech stack, modernization angle, project scope).`,
      `   4) Fit rationale paragraph: tie ONE specific candidate strength to ONE role need.`,
      `   5) Closing CTA paragraph: ONE soft question (e.g. "Are you open to a brief conversation about the scope?").`,
      `- Total length: 130-200 words for the body (not counting greeting).`,
      `- DO NOT include any sign-off line ("Best,", "Best regards,", "Cheers,", recruiter name, [Your Name], etc.) — the user's signature is appended automatically afterwards.`,
      `- No emojis. No exclamation marks. No "exciting opportunity", "rockstar", "ninja", "reach out".`,
      `- First name only for the greeting; no honorifics ("Mr./Ms.").`,
      `- Subject line: descriptive, includes role + a candidate or project hook. 6-12 words. Use a separator like "|" or "—" if helpful.`,
      `- The body field MUST contain literal newline characters between paragraphs. Do not collapse to a single line.`,
    ].filter(Boolean).join('\n');

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an experienced senior technical recruiter writing personalised outreach. ' +
          'You write the way a thoughtful human writes — specific, well-formatted into paragraphs, ' +
          'and never templated. Always match the exemplar structure exactly. ' +
          'Never auto-sign emails — the user appends their own signature.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: '6-12 word descriptive subject line including the role + a candidate or project hook.' },
            body: { type: Type.STRING, description: 'Email body with 4 paragraphs separated by blank lines. 130-200 words. No sign-off.' },
          },
          required: ['subject', 'body'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned empty response for outreach generation');

    const parsed = JSON.parse(text.trim()) as { subject: string; body: string };
    return { subject: parsed.subject.trim(), body: parsed.body.trim() };
  },
};
