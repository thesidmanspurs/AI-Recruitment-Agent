import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env.js';
import { GEMINI_MODEL } from '../../config/constants.js';

/**
 * Structured CV profile extracted and scored by Gemini in a single call.
 * The raw CV text is NOT stored — only this structured representation is
 * persisted for candidates in the top 50%.
 */
export interface CVAnalysisResult {
  // ── Identity ──────────────────────────────────────────────────────────────
  name: string;
  email: string | null;
  phone: string | null;
  currentTitle: string;
  company: string | null;
  location: string | null;
  experienceYears: number | null;
  educationLevel: 'High School' | 'Bachelor' | 'Master' | 'PhD' | 'Other' | null;

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: string[]; // Top 8-12 technical + domain skills extracted from CV

  // ── Fit scoring (vs the job description passed in) ────────────────────────
  matchScore: number;       // 0.0 – 10.0 (one decimal)
  matchExplanation: string; // 1-2 sentence rationale
  strengths: string[];      // What aligns with the JD
  gaps: string[];           // What is missing per the JD requirements
}

/**
 * CV Analysis Service — uses Gemini to extract a structured profile from
 * raw CV text AND score the candidate against a job description in a single
 * API call (minimises latency + cost).
 *
 * The prompt is constructed to be highly deterministic (temperature=0.1) and
 * structured via responseSchema for easy JSON parsing. No grounding is used
 * here — we trust the CV text directly.
 */
export const cvAnalysisService = {
  isAvailable(): boolean {
    return !!env.GEMINI_API_KEY;
  },

  /**
   * Analyse a single CV and return a structured scored profile.
   *
   * @param cvText       Extracted plain text from the CV (never stored after this call)
   * @param jobTitle     Role title from the RankingSession
   * @param rawJobText   Full job description text for scoring context
   */
  async analyzeCV(
    cvText: string,
    jobTitle: string,
    rawJobText: string,
  ): Promise<CVAnalysisResult> {
    if (!env.GEMINI_API_KEY) {
      throw new Error('Gemini client not initialised — check GEMINI_API_KEY');
    }
    const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    // Truncate to ~6000 chars to stay within Gemini's effective context while
    // keeping cost low. CVs rarely have meaningful signal beyond that length.
    const cvSnippet = cvText.length > 6000 ? cvText.slice(0, 6000) + '\n[...truncated]' : cvText;
    const jdSnippet = rawJobText.length > 2000 ? rawJobText.slice(0, 2000) + '\n[...truncated]' : rawJobText;

    const prompt = [
      'You are an expert HR analyst and senior technical recruiter.',
      'Perform TWO tasks on the inputs below in ONE response:',
      '',
      'TASK 1 — Extract structured profile from the CV:',
      '  • Full name (as written — do not infer)',
      '  • Email address (null if not present)',
      '  • Phone number (null if not present)',
      '  • Most recent job title',
      '  • Most recent company name (null if not present)',
      '  • Location / city (null if not stated)',
      '  • Total years of professional experience (float estimate; null if impossible to determine)',
      '  • Highest education level: "High School" | "Bachelor" | "Master" | "PhD" | "Other" | null',
      '  • Top 8-12 key skills (technical tools, languages, frameworks, domains)',
      '',
      'TASK 2 — Score the candidate against the job description:',
      '  • matchScore: 0.0–10.0 (one decimal). Scoring rubric:',
      '      9-10  Excellent: title + core skills + experience all align',
      '      7-8.9 Good: clearly relevant background, minor gaps',
      '      5-6.9 Partial: related domain but notable gaps',
      '      3-4.9 Weak: loose keyword overlap only',
      '      0-2.9 Unsuitable: unrelated role or insufficient experience',
      '  • matchExplanation: 1-2 objective sentences citing specific evidence from the CV',
      '  • strengths: 2-5 specific things from the CV that align with the JD',
      '  • gaps: 1-4 JD requirements not clearly evidenced in the CV (0 if excellent fit)',
      '',
      `[JOB TITLE]: ${jobTitle}`,
      '',
      '[JOB DESCRIPTION]:',
      '"""',
      jdSnippet,
      '"""',
      '',
      '[CV TEXT]:',
      '"""',
      cvSnippet,
      '"""',
    ].join('\n');

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert HR analyst. Extract factual information from CVs precisely ' +
          'and score candidates objectively. Never fabricate information not present in the CV. ' +
          'Be critical and calibrated with scores — a 9+ score means genuine excellence.',
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING, nullable: true },
            phone: { type: Type.STRING, nullable: true },
            currentTitle: { type: Type.STRING },
            company: { type: Type.STRING, nullable: true },
            location: { type: Type.STRING, nullable: true },
            experienceYears: { type: Type.NUMBER, nullable: true },
            educationLevel: {
              type: Type.STRING,
              enum: ['High School', 'Bachelor', 'Master', 'PhD', 'Other'],
              nullable: true,
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchScore: { type: Type.NUMBER },
            matchExplanation: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'name', 'currentTitle', 'skills',
            'matchScore', 'matchExplanation', 'strengths', 'gaps',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned empty response for CV analysis');

    const raw = JSON.parse(text.trim()) as CVAnalysisResult;

    // Defensive post-processing
    const score = Math.max(0, Math.min(10, Number(raw.matchScore) || 0));
    return {
      name: (raw.name || 'Unknown Candidate').trim(),
      email: raw.email?.trim() || null,
      phone: raw.phone?.trim() || null,
      currentTitle: (raw.currentTitle || 'Unknown').trim(),
      company: raw.company?.trim() || null,
      location: raw.location?.trim() || null,
      experienceYears:
        raw.experienceYears != null && Number.isFinite(raw.experienceYears)
          ? Math.max(0, raw.experienceYears)
          : null,
      educationLevel: raw.educationLevel ?? null,
      skills: Array.isArray(raw.skills) ? raw.skills.slice(0, 12) : [],
      matchScore: Math.round(score * 10) / 10,
      matchExplanation: (raw.matchExplanation || '').trim() || 'Scored by AI.',
      strengths: Array.isArray(raw.strengths) ? raw.strengths.slice(0, 5) : [],
      gaps: Array.isArray(raw.gaps) ? raw.gaps.slice(0, 4) : [],
    };
  },
};
