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
    jobTitle: string;
    jobKeywords: string[];
    recruiterName?: string;
  }): Promise<{ subject: string; body: string }> {
    const client = getClient();
    if (!client) throw new Error('Gemini client not initialised — check GEMINI_API_KEY');

    const prompt = [
      `Write a short, warm, personalised recruiter outreach email.`,
      ``,
      `Candidate: ${params.candidateName}, ${params.candidateTitle} at ${params.candidateCompany}.`,
      `Their notable strengths: ${params.candidateStrengths.slice(0, 3).join('; ') || '—'}.`,
      ``,
      `Role on offer: ${params.jobTitle}.`,
      `Key tech / skills: ${params.jobKeywords.slice(0, 6).join(', ')}.`,
      ``,
      `Constraints:`,
      `- 4-6 sentences total, broken into 3 short paragraphs separated by BLANK LINES (two newline characters between paragraphs).`,
      `  Paragraph 1: greeting on its own line (e.g. "Hi {firstName},"), then a blank line.`,
      `  Paragraph 2: 1-2 sentences referencing one specific strength + tying to a role keyword.`,
      `  Paragraph 3: 1-2 sentences with a soft CTA (e.g. "Open to a 15-min chat next week?").`,
      `- Do NOT include a sign-off line ("Best,", "Regards,", recruiter name etc.) — the user appends their own signature.`,
      `- No emojis, no exclamation marks, no "exciting opportunity"`,
      `- First name only, no honorifics`,
      `- The body field MUST contain the literal newline characters between paragraphs; do not return a single-line string.`,
    ].filter(Boolean).join('\n');

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an experienced technical recruiter writing personalised outreach. ' +
          'Sound like a human, not a template. Be concise, specific, and respectful of the candidate\'s time.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: '6-10 word subject line, no clickbait.' },
            body: { type: Type.STRING, description: 'The email body, 4-6 sentences, plain text.' },
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
