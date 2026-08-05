import { prisma } from '../../config/database.js';
import { cvParserService } from './cvParserService.js';
import { cvAnalysisService, type CVAnalysisResult } from './cvAnalysisService.js';

export interface UploadedCVFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ProcessedCV {
  filename: string;
  result: CVAnalysisResult | null;
  error: string | null;
}

export const rankingSessionService = {
  /** Create a new empty RankingSession for the user. */
  async createSession(userId: string, name: string, jobTitle: string, rawJobText: string) {
    return prisma.rankingSession.create({
      data: { userId, name, jobTitle, rawJobText },
    });
  },

  /** List all sessions for a user, newest first. */
  async listSessions(userId: string) {
    return prisma.rankingSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        status: true,
        totalUploaded: true,
        totalProcessed: true,
        totalSaved: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /** Get a session with its ranked candidates. Access-checked by the caller. */
  async getSession(sessionId: string, userId: string) {
    return prisma.rankingSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        candidates: {
          orderBy: { rankPosition: 'asc' },
        },
      },
    });
  },

  /** Get only saved (top-50%) candidates for a session. */
  async getSavedCandidates(sessionId: string, userId: string) {
    const session = await prisma.rankingSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!session) return null;

    return prisma.rankedCandidate.findMany({
      where: { sessionId, isSaved: true },
      orderBy: { rankPosition: 'asc' },
    });
  },

  /** Delete a session and all its candidates (cascade). */
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    const result = await prisma.rankingSession.deleteMany({
      where: { id: sessionId, userId },
    });
    return result.count > 0;
  },

  /** Delete all ranking sessions older than 45 days. */
  async cleanupExpiredSessions(): Promise<number> {
    const RETENTION_DAYS = 45;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const result = await prisma.rankingSession.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    if (result.count > 0) {
      console.log(`[RankingCleanup] Deleted ${result.count} expired session(s) older than ${RETENTION_DAYS} days.`);
    }
    return result.count;
  },

  /**
   * Process a new batch of uploaded CV files for an EXISTING or NEW session.
   *
   * Incremental batch feature:
   *   - Parses and evaluates the new CV files against the session's JD.
   *   - Merges newly evaluated candidates with existing candidates in the session.
   *   - Re-sorts all candidates by matchScore descending and re-calculates rankPositions + medals.
   *   - Tags newly added candidates with `isNewBatch: true` for UI highlight badges!
   *   - Updates database with re-ranked Top 50% candidates.
   */
  async processBatch(
    sessionId: string,
    userId: string,
    files: UploadedCVFile[],
  ): Promise<{
    session: { id: string; totalUploaded: number; totalProcessed: number; totalSaved: number; status: string };
    candidates: Array<CVAnalysisResult & {
      originalFileName: string;
      rankPosition: number;
      medal: string | null;
      isSaved: boolean;
      isNewBatch: boolean;
      error: string | null;
    }>;
    errors: Array<{ filename: string; error: string }>;
  }> {
    // Validate session ownership
    const session = await prisma.rankingSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new Error('Session not found or access denied.');

    // Fetch existing candidates from previous batches for this session
    const existingDbCandidates = await prisma.rankedCandidate.findMany({
      where: { sessionId },
    });

    // Mark session as processing
    await prisma.rankingSession.update({
      where: { id: sessionId },
      data: {
        status: 'PROCESSING',
        totalUploaded: { increment: files.length },
      },
    });

    // ── Step 1-3: Parse + Analyse new CV files in parallel ────────────────
    const newResults = await Promise.all(
      files.map(async (file): Promise<ProcessedCV> => {
        let buffer: Buffer | null = file.buffer;
        try {
          // 1. Extract text using bulletproof parseBuffer
          const parsed = await cvParserService.parseBuffer(buffer, file.originalname, file.mimetype);
          const rawText = parsed.text;

          // 2. Immediately release buffer reference
          buffer = null;

          // 3. Gemini analysis against session's JD criteria
          const analysis = await cvAnalysisService.analyzeCV(
            rawText,
            session.jobTitle,
            session.rawJobText,
          );
          return { filename: file.originalname, result: analysis, error: null };
        } catch (err) {
          buffer = null;
          return {
            filename: file.originalname,
            result: null,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );

    const successfulNew = newResults.filter(r => r.result !== null);
    const failedNew = newResults.filter(r => r.result === null);

    // Prepare unified candidate pool items
    const newCandidateItems = successfulNew.map(r => ({
      filename: r.filename,
      analysis: r.result!,
      isNewBatch: true,
    }));

    const existingCandidateItems = existingDbCandidates.map(c => ({
      filename: c.originalFileName,
      analysis: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        currentTitle: c.currentTitle,
        company: c.company,
        location: c.location,
        experienceYears: c.experienceYears,
        educationLevel: c.educationLevel as any,
        skills: c.skills,
        matchScore: c.matchScore,
        matchExplanation: c.matchExplanation,
        strengths: c.strengths,
        gaps: c.gaps,
      },
      isNewBatch: false,
    }));

    // Combined candidate pool (existing + newly uploaded)
    const combinedPool = [...existingCandidateItems, ...newCandidateItems];

    // ── Step 4: Sort combined pool by matchScore descending ───────────────
    combinedPool.sort((a, b) => b.analysis.matchScore - a.analysis.matchScore);

    // ── Step 5: Determine save threshold across total pool ────────────────
    const saveCount = Math.max(1, Math.ceil(combinedPool.length * 0.5));

    const rankedCombined = combinedPool.map((item, index) => {
      const rankPosition = index + 1;
      const medal =
        rankPosition === 1 ? 'gold' :
        rankPosition === 2 ? 'silver' :
        rankPosition === 3 ? 'bronze' : null;
      const isSaved = rankPosition <= saveCount;
      return {
        filename: item.filename,
        analysis: item.analysis,
        rankPosition,
        medal,
        isSaved,
        isNewBatch: item.isNewBatch,
      };
    });

    const totalSaved = rankedCombined.filter(r => r.isSaved).length;

    // ── Step 6: Clear old saved candidates and persist re-ranked Top 50% ──
    await prisma.rankedCandidate.deleteMany({
      where: { sessionId },
    });

    if (rankedCombined.length > 0) {
      await prisma.rankedCandidate.createMany({
        data: rankedCombined
          .filter(r => r.isSaved)
          .map(r => ({
            sessionId,
            name: r.analysis.name,
            email: r.analysis.email,
            phone: r.analysis.phone,
            currentTitle: r.analysis.currentTitle,
            company: r.analysis.company,
            location: r.analysis.location,
            experienceYears: r.analysis.experienceYears,
            educationLevel: r.analysis.educationLevel,
            matchScore: r.analysis.matchScore,
            rankPosition: r.rankPosition,
            matchExplanation: r.analysis.matchExplanation,
            skills: r.analysis.skills,
            strengths: r.analysis.strengths,
            gaps: r.analysis.gaps,
            originalFileName: r.filename,
            isSaved: true,
            medal: r.medal,
          })),
        skipDuplicates: false,
      });
    }

    // ── Step 7: Update session counters + status ──────────────────────────
    const updatedSession = await prisma.rankingSession.update({
      where: { id: sessionId },
      data: {
        totalProcessed: combinedPool.length,
        totalSaved: totalSaved,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        totalUploaded: true,
        totalProcessed: true,
        totalSaved: true,
        status: true,
      },
    });

    // Build response: full ranked list (saved + not saved) with isNewBatch tag
    const candidates = rankedCombined.map(r => ({
      ...r.analysis,
      originalFileName: r.filename,
      rankPosition: r.rankPosition,
      medal: r.medal,
      isSaved: r.isSaved,
      isNewBatch: r.isNewBatch,
      error: null,
    }));

    return {
      session: updatedSession,
      candidates,
      errors: failedNew.map(r => ({ filename: r.filename, error: r.error! })),
    };
  },
};
