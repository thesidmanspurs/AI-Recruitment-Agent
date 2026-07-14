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

  // Draft a brand-new job description (when the box is empty) OR clean up and
  // enrich the one the recruiter already pasted. Returns plain text destined
  // for the New-campaign textarea (reviewed by the user before analysis).
  async generateJobDescription(params: {
    jobTitle?: string;
    location?: string;
    jobType?: string;
    department?: string;
    existingText?: string;
  }): Promise<string> {
    const client = getClient();
    if (!client) throw new Error('Gemini client not initialised — check GEMINI_API_KEY');

    const hasText = (params.existingText || '').trim().length > 0;
    const context = [
      params.jobTitle ? `Role / campaign: ${params.jobTitle}` : '',
      params.department ? `Department: ${params.department}` : '',
      params.jobType ? `Employment type: ${params.jobType}` : '',
      params.location ? `Work location: ${params.location}` : '',
    ].filter(Boolean).join('\n');

    // A detailed, sourceable JD — must state seniority/years of experience and
    // name a concrete tech stack so downstream keyword/requirement extraction
    // has real signal to work with.
    const SECTIONS =
      'Structure it with these plain-text sections (no markdown "#" headers, use "Section:" labels and "* " bullets):\n' +
      '1. Overview — 2–3 sentences: the role, seniority level, and its impact.\n' +
      '2. Responsibilities: — 6–8 specific bullets.\n' +
      '3. Required Qualifications: — 6–9 bullets. MUST include an explicit years-of-experience bar (e.g. "5+ years …"), and name concrete technologies, languages, frameworks, cloud platforms, tools and methodologies relevant to this role. Be specific and sourceable, not generic.\n' +
      '4. Preferred / Nice-to-have: — 3–5 bullets (certifications, adjacent tools, domain experience).\n' +
      '5. Tech stack: — one line listing the core stack, comma-separated.\n' +
      'Do NOT invent a company name, salary, or unrelated perks. Return plain text only.';

    const prompt = hasText
      ? `Improve and substantially EXPAND the job description below into a complete, detailed spec. Fix structure and grammar and keep it true to the original intent, but fill any gaps — especially add an explicit years-of-experience requirement and a concrete, named tech stack if they are missing.\n\n${SECTIONS}\n\nContext:\n${context || '(none provided)'}\n\nCurrent description:\n"""\n${params.existingText}\n"""`
      : `Write a detailed, professional job description for the role below.\n\n${SECTIONS}\n\nContext:\n${context || '(no extra context — infer a sensible standard version of this role)'}`;

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert technical recruiter who writes clear, specific, unbiased job descriptions. You always state a concrete seniority / years-of-experience bar and name the exact technologies, frameworks and tools for the role so recruiters can source against them.',
      },
    });
    const text = response.text;
    if (!text) throw new Error('Gemini returned empty response for job description generation');
    return text.trim();
  },

  // Enhance an already-extracted spec: sharpen the title, add missing high-signal
  // alternate titles / keywords, and make requirements crisper and more sourceable.
  // Grounded in the original job text so it never fabricates unrelated skills.
  async enhanceJobSpec(params: {
    rawJobText: string;
    jobTitle: string;
    extractedKeywords: string[];
    requirements: string[];
  }): Promise<JobAnalysis> {
    const client = getClient();
    if (!client) throw new Error('Gemini client not initialised — check GEMINI_API_KEY');

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents:
        `Refine and STRENGTHEN the recruitment spec below. Sharpen the primary title, add any missing high-signal alternate titles recruiters search on LinkedIn, add specific tech/skill keywords that are clearly implied by the job description, and rewrite the requirements to be crisper and more sourceable. Stay grounded in the job description — do NOT fabricate unrelated skills.\n\nJob Description:\n"""\n${params.rawJobText}\n"""\n\nCurrent title: ${params.jobTitle}\nCurrent keywords: ${params.extractedKeywords.join(', ')}\nCurrent requirements:\n- ${params.requirements.join('\n- ')}`,
      config: {
        systemInstruction:
          'You are an expert recruitment AI. Return an improved primary title, 2–4 closest alternative titles, 6–9 hyper-specific tech/skill keywords, 3–5 crisp actionable requirements, and the top sourcing platforms from [LinkedIn, Upwork, Reddit].',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            alternateTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
            extractedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            preferredPlatforms: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'alternateTitles', 'extractedKeywords', 'requirements', 'preferredPlatforms'],
        },
      },
    });
    const text = response.text;
    if (!text) throw new Error('Gemini returned empty response for job spec enhancement');
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
      `   2) Personal observation paragraph: phrase candidate role references CAUTIOUSLY because Apollo data can be stale. Prefer phrasings like "your LinkedIn profile shows a strong background in...", "I noticed your work in [skill/domain]...", "your experience with [keyword]..." — AVOID declarative phrasings like "as a {Title} at {Company}" or "in your current role at X". Reference skills, keywords, or background topics, NOT specific job titles or employers.`,
      `   3) Role pitch paragraph: name the role, location/employment type if provided, and 1-2 concrete role specifics (tech stack, modernization angle, project scope).`,
      `   4) Fit rationale paragraph: tie ONE specific candidate strength or keyword to ONE role need — again avoid naming their current employer.`,
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

  /**
   * GROUNDED fit scoring — uses Gemini + Google Search to research the
   * candidate's real public profile (LinkedIn skills/experience, company
   * sites, GitHub) and then scores per the scoring.md rubric. Far more
   * accurate than title-only scoring because it judges actual skills and
   * years of experience, not just a job title.
   *
   * Text-mode output (grounding can't combine with responseSchema), parsed
   * from a KEY: value envelope. ~$0.035 + a few seconds per candidate.
   */
  async scoreCandidateFitGrounded(params: {
    candidateName: string;
    candidateTitle: string;
    candidateCompany: string;
    linkedinUrl?: string;
    candidateBio?: string;
    jobTitle: string;
    jobKeywords: string[];
    jobRequirements?: string[];
    alternateTitles?: string[];
  }): Promise<{ score: number; reasoning: string; strengths: string[]; gaps: string[] }> {
    const client = getClient();
    if (!client) return { score: 6, reasoning: 'Gemini unavailable; unscored.', strengths: [], gaps: [] };

    const prompt = [
      `You are an expert Technical Recruiter and HR Manager. Score this candidate`,
      `1-10 (1 = completely unsuitable, 10 = perfect match) against the job spec.`,
      `Be highly objective and critical.`,
      ``,
      `STEP 1 — From the job spec, identify MUST-HAVE skills, NICE-TO-HAVE skills,`,
      `and required years of experience.`,
      `STEP 2 — Research this specific candidate on the public web (use the`,
      `LinkedIn URL if given; also company sites, GitHub, conference bios) to find`,
      `their ACTUAL skills, technologies, years of experience and achievements.`,
      `Only trust results that clearly match this person (name + company + title).`,
      `STEP 3 — Map what you found to the requirements. Weight must-haves and`,
      `years-of-experience heavily. A candidate missing a must-have cannot exceed ~6.`,
      `If you cannot find reliable info, score conservatively from the title and say so.`,
      ``,
      `[JOB SPECIFICATION]`,
      `  Title: ${params.jobTitle}`,
      params.alternateTitles?.length ? `  Acceptable equivalent titles: ${params.alternateTitles.join(', ')}` : '',
      `  Key skills / keywords: ${params.jobKeywords.slice(0, 12).join(', ')}`,
      params.jobRequirements?.length ? `  Requirements: ${params.jobRequirements.slice(0, 8).join('; ')}` : '',
      ``,
      `[CANDIDATE]`,
      `  Name: ${params.candidateName}`,
      `  Current title: ${params.candidateTitle}`,
      `  Company: ${params.candidateCompany}`,
      params.linkedinUrl ? `  LinkedIn: ${params.linkedinUrl}` : '',
      params.candidateBio ? `  Known background: ${params.candidateBio.slice(0, 400)}` : '',
      ``,
      `Reply STRICTLY in this format, nothing else:`,
      `SCORE: <number 1-10, one decimal>`,
      `STRENGTHS: <semicolon-separated exact skills/experience that MATCH the spec>`,
      `GAPS: <semicolon-separated required/preferred items the candidate is missing>`,
      `REASONING: <one objective sentence justifying the score, citing what you found>`,
    ].filter(Boolean).join('\n');

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        },
      });
      const text = (response.text ?? '').trim();
      if (!text) throw new Error('empty');
      const pick = (key: string): string => {
        const m = text.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, 'im'));
        return m ? m[1].trim() : '';
      };
      const splitList = (s: string) =>
        s.split(';').map(x => x.trim()).filter(x => x && !/^none$/i.test(x)).slice(0, 4);
      const scoreNum = parseFloat(pick('SCORE'));
      const score = Number.isFinite(scoreNum) ? Math.max(1, Math.min(10, scoreNum)) : 6;
      return {
        score: Math.round(score * 10) / 10,
        reasoning: pick('REASONING') || 'Scored via web research.',
        strengths: splitList(pick('STRENGTHS')),
        gaps: splitList(pick('GAPS')),
      };
    } catch (err) {
      console.warn('[Gemini] scoreCandidateFitGrounded failed:', err instanceof Error ? err.message : err);
      return { score: 6, reasoning: 'Grounded scoring failed; defaulted.', strengths: [], gaps: [] };
    }
  },

  /**
   * Score how well a candidate fits a specific job, 0–10, using Gemini.
   * This is a REAL fit assessment (replaces the old hardcoded 9.5) — Gemini
   * compares the candidate's title/company/background against the job title,
   * keywords and requirements and returns a calibrated score + rationale +
   * concrete strengths/gaps. No web grounding needed (cheap token-only call).
   *
   * Calibration guidance baked into the prompt:
   *   9–10  near-perfect match on title + most key skills
   *   7–8.9 strong, clearly relevant background, minor gaps
   *   5–6.9 partial / adjacent fit
   *   <5    weak or unrelated
   */
  async scoreCandidateFit(params: {
    candidateName: string;
    candidateTitle: string;
    candidateCompany: string;
    candidateBio?: string;
    jobTitle: string;
    jobKeywords: string[];
    jobRequirements?: string[];
    alternateTitles?: string[];
  }): Promise<{ score: number; reasoning: string; strengths: string[]; gaps: string[] }> {
    const client = getClient();
    if (!client) {
      // No Gemini → neutral mid score so the row still appears but isn't
      // falsely inflated.
      return { score: 6, reasoning: 'Gemini unavailable; unscored.', strengths: [], gaps: [] };
    }

    const prompt = [
      `You are an expert Technical Recruiter and HR Manager with a sharp eye for`,
      `aligning candidate capabilities with business needs. Analyze this candidate`,
      `against the job spec and rank them 1-10 (1 = completely unsuitable,`,
      `10 = perfect match). Be highly objective and critical.`,
      ``,
      `This is a SOURCING-stage screen against a SHORT public profile (a title +`,
      `a one-line bio), NOT a full CV review. Judge how well the candidate's ROLE,`,
      `SENIORITY and visible background align with the job and its acceptable`,
      `equivalent titles. CRITICAL: skills you can't see in this short profile are`,
      `UNKNOWN, not absent — list them as gaps to verify later. Do NOT cap or`,
      `penalise a candidate just because a one-line bio omits a must-have; only`,
      `penalise when the candidate's role is genuinely different or junior.`,
      ``,
      `[JOB SPECIFICATION]`,
      `  Title: ${params.jobTitle}`,
      params.alternateTitles?.length ? `  Acceptable equivalent titles: ${params.alternateTitles.join(', ')}` : '',
      `  Key skills / keywords: ${params.jobKeywords.slice(0, 12).join(', ')}`,
      params.jobRequirements?.length ? `  Requirements: ${params.jobRequirements.slice(0, 8).join('; ')}` : '',
      ``,
      `[CANDIDATE]`,
      `  Current title: ${params.candidateTitle}`,
      `  Company: ${params.candidateCompany}`,
      params.candidateBio ? `  Background: ${params.candidateBio.slice(0, 800)}` : '',
      ``,
      `Scoring calibration (1-10, one decimal allowed) — based on ROLE/TITLE fit:`,
      `  9-10  title IS the role or an exact equivalent, clearly relevant background`,
      `  7-8.9 strong: same role family / adjacent matching title at the right seniority`,
      `  5-6.9 partial: related but off (wrong seniority, broader/narrower role)`,
      `  3-4.9 weak: different discipline, only loose keyword overlap`,
      `  1-2.9 unsuitable: unrelated role`,
      `Reward a clear title/role match (don't punish it for a thin bio); score`,
      `genuinely off-target roles low. Provide:`,
      `  - strengths: the title/role/skills signals that MATCH the spec`,
      `  - gaps: required items not yet verifiable from this profile (to confirm later)`,
      `  - reasoning: a brief objective justification for the score`,
    ].filter(Boolean).join('\n');

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert Technical Recruiter screening SHORT sourcing profiles for ' +
            'role/title fit. Reward clear title/role matches; score genuinely off-target ' +
            'roles low. Treat skills not visible in the brief profile as unknown gaps to ' +
            'verify, not as absent — do not cap a clear title match for a thin bio. Reserve 9+ for exact-role matches.',
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: '1-10 fit score, one decimal allowed. Critical & objective.' },
              reasoning: { type: Type.STRING, description: 'Brief objective justification for the score.' },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: '1-4 exact skills/experience that MATCH the spec.' },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: '0-3 required/preferred items the candidate is missing.' },
            },
            required: ['score', 'reasoning', 'strengths', 'gaps'],
          },
        },
      });
      const text = response.text;
      if (!text) throw new Error('empty');
      const parsed = JSON.parse(text.trim()) as {
        score: number; reasoning: string; strengths: string[]; gaps: string[];
      };
      const score = Math.max(0, Math.min(10, Number(parsed.score) || 0));
      return {
        score: Math.round(score * 10) / 10,
        reasoning: (parsed.reasoning || '').trim() || 'Scored by Gemini.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 3) : [],
      };
    } catch (err) {
      console.warn('[Gemini] scoreCandidateFit failed:', err instanceof Error ? err.message : err);
      return { score: 6, reasoning: 'Scoring failed; defaulted.', strengths: [], gaps: [] };
    }
  },

  /**
   * Verify a candidate's current title using Gemini + Google Search grounding.
   *
   * Apollo's snapshot can be 1-2 years stale, especially for non-US records.
   * This method runs a Google-search-grounded query so Gemini can look at the
   * candidate's public web presence (LinkedIn snippets in search results,
   * company sites, conference bios) and either confirm or correct Apollo's
   * title/company claim.
   *
   * Output is text-mode (Gemini disallows responseSchema + grounding
   * simultaneously); we parse a small key:value envelope.
   *
   * Cost: ~$0.035 per call (Google's grounding pricing on top of token cost).
   * Latency: 3-5s per call. Call only on rows Apollo couldn't auto-confirm.
   */
  async verifyCurrentRole(params: {
    candidateName: string;
    apolloTitle: string;
    apolloCompany: string;
    linkedinUrl?: string;
    email?: string;
    location?: string;
  }): Promise<{
    verdict: 'confirmed' | 'mismatch' | 'uncertain';
    suggestedTitle?: string;
    suggestedCompany?: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    grounded: boolean;
  }> {
    const client = getClient();
    if (!client) {
      return {
        verdict: 'uncertain',
        confidence: 'low',
        reasoning: 'Gemini not configured.',
        grounded: false,
      };
    }

    const prompt = [
      `You are a recruiter verifying whether a third-party data vendor's snapshot of a candidate's job title is still accurate.`,
      ``,
      `CANDIDATE:`,
      `  Name: ${params.candidateName}`,
      params.linkedinUrl ? `  LinkedIn: ${params.linkedinUrl}` : '',
      params.email ? `  Email: ${params.email}` : '',
      params.location ? `  Location: ${params.location}` : '',
      ``,
      `VENDOR (Apollo.io) CLAIMS:`,
      `  Title: ${params.apolloTitle}`,
      `  Company: ${params.apolloCompany}`,
      ``,
      `TASK: Search the public web (LinkedIn results, company sites, github, twitter, conference talks) for this exact person and decide whether the Apollo claim is still their CURRENT role. Be especially careful with common names — only trust matches where the LinkedIn URL, email domain, or location aligns.`,
      ``,
      `Reply STRICTLY in this format on separate lines, no extra prose:`,
      `VERDICT: confirmed | mismatch | uncertain`,
      `CURRENT_TITLE: <their actual current title, or "unknown">`,
      `CURRENT_COMPANY: <their actual current company, or "unknown">`,
      `CONFIDENCE: high | medium | low`,
      `REASONING: <one short sentence citing what you found>`,
      ``,
      `Rules:`,
      `- "confirmed" only when public evidence clearly matches Apollo's title AND company.`,
      `- "mismatch" only when you found strong evidence (LinkedIn snippet, recent post, company-employee page) of a DIFFERENT current title.`,
      `- "uncertain" when you can't find this specific person in public results or the signal is weak.`,
      `- If CURRENT_TITLE differs only by seniority phrasing (e.g. "Sr." vs "Senior"), call it confirmed.`,
      `- Never invent a title without web evidence — prefer "uncertain" over guessing.`,
    ].filter(Boolean).join('\n');

    let response;
    try {
      response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          // Grounding tool. Gemini will run real Google searches as part of
          // generating the answer. Cannot be combined with responseSchema.
          tools: [{ googleSearch: {} }],
          temperature: 0.1, // keep verifier deterministic
        },
      });
    } catch (err) {
      return {
        verdict: 'uncertain',
        confidence: 'low',
        reasoning: `Verification call failed: ${err instanceof Error ? err.message : 'unknown'}`,
        grounded: false,
      };
    }

    const text = (response.text ?? '').trim();
    if (!text) {
      return {
        verdict: 'uncertain',
        confidence: 'low',
        reasoning: 'Empty verifier response.',
        grounded: false,
      };
    }

    const pick = (key: string): string => {
      const m = text.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, 'im'));
      return m ? m[1].trim() : '';
    };

    const verdictRaw = pick('VERDICT').toLowerCase();
    const verdict: 'confirmed' | 'mismatch' | 'uncertain' =
      verdictRaw === 'confirmed' ? 'confirmed' :
      verdictRaw === 'mismatch' ? 'mismatch' : 'uncertain';

    const confRaw = pick('CONFIDENCE').toLowerCase();
    const confidence: 'high' | 'medium' | 'low' =
      confRaw === 'high' ? 'high' :
      confRaw === 'medium' ? 'medium' : 'low';

    const titleVal = pick('CURRENT_TITLE');
    const companyVal = pick('CURRENT_COMPANY');
    const suggestedTitle =
      titleVal && titleVal.toLowerCase() !== 'unknown' ? titleVal : undefined;
    const suggestedCompany =
      companyVal && companyVal.toLowerCase() !== 'unknown' ? companyVal : undefined;
    const reasoning = pick('REASONING') || 'No reasoning provided.';

    return { verdict, suggestedTitle, suggestedCompany, confidence, reasoning, grounded: true };
  },
};
