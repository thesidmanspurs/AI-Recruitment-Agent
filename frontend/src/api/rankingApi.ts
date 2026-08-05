import { apiClient } from './client.js';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RankingSession {
  id: string;
  name: string;
  jobTitle: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalUploaded: number;
  totalProcessed: number;
  totalSaved: number;
  createdAt: string;
  updatedAt: string;
  candidates?: RankedCandidate[];
}

export interface RankedCandidate {
  id?: string;
  sessionId?: string;
  name: string;
  email: string | null;
  phone: string | null;
  currentTitle: string;
  company: string | null;
  location: string | null;
  experienceYears: number | null;
  educationLevel: string | null;
  matchScore: number;
  rankPosition: number;
  matchExplanation: string;
  skills: string[];
  strengths: string[];
  gaps: string[];
  originalFileName: string;
  isSaved: boolean;
  isNewBatch?: boolean;
  medal: 'gold' | 'silver' | 'bronze' | null;
  error?: string | null;
}

export interface UploadResult {
  success: boolean;
  session: Pick<RankingSession, 'id' | 'totalUploaded' | 'totalProcessed' | 'totalSaved' | 'status'>;
  candidates: RankedCandidate[];
  errors: Array<{ filename: string; error: string }>;
  summary: {
    submitted: number;
    successful: number;
    failed: number;
    saved: number;
  };
}

// ─── API client ────────────────────────────────────────────────────────────────

export const rankingApi = {
  /** Create a new ranking session. */
  createSession(data: {
    name: string;
    jobTitle: string;
    rawJobText: string;
  }): Promise<{ success: boolean; session: RankingSession }> {
    return apiClient.post('/ranking', data);
  },

  /** List all sessions for the current user. */
  listSessions(): Promise<{ success: boolean; sessions: RankingSession[] }> {
    return apiClient.get('/ranking');
  },

  /** Get a single session with its full candidate list. */
  getSession(id: string): Promise<{ success: boolean; session: RankingSession }> {
    return apiClient.get(`/ranking/${id}`);
  },

  /** Delete a session and all its candidates. */
  deleteSession(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/ranking/${id}`);
  },

  /**
   * Upload CV files and get ranked results back.
   * Uses raw fetch with FormData — browser sets multipart boundary automatically.
   * apiClient.post would JSON.stringify the body which breaks FormData.
   */
  async uploadCVs(sessionId: string, files: File[]): Promise<UploadResult> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await fetch(`${BASE}/api/ranking/${sessionId}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `Upload failed: HTTP ${res.status}`);
    }
    return json as UploadResult;
  },

  /** Get only persisted (top-50%) candidates for a session. */
  getSavedCandidates(
    sessionId: string,
  ): Promise<{ success: boolean; candidates: RankedCandidate[] }> {
    return apiClient.get(`/ranking/${sessionId}/candidates`);
  },
};
