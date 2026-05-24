import type { Candidate, JobSpec, ActivityLog, JobAnalysis } from '../types';

export interface AppState {
  jobSpec: JobSpec | null;
  jobAnalysis: JobAnalysis | null;
  candidates: Candidate[];
  activityLogs: ActivityLog[];
  isAnalyzing: boolean;
  isSourcing: boolean;
  isEnriching: boolean;
  isSendingOutreach: boolean;
  error: string | null;
  isSimulated: boolean;
}

export const initialState: AppState = {
  jobSpec: null,
  jobAnalysis: null,
  candidates: [],
  activityLogs: [],
  isAnalyzing: false,
  isSourcing: false,
  isEnriching: false,
  isSendingOutreach: false,
  error: null,
  isSimulated: false,
};

export type AppAction =
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_SOURCING'; payload: boolean }
  | { type: 'SET_ENRICHING'; payload: boolean }
  | { type: 'SET_SENDING_OUTREACH'; payload: boolean }
  | { type: 'SET_JOB_ANALYSIS'; payload: { analysis: JobAnalysis; isSimulated: boolean } }
  | { type: 'SET_CANDIDATES'; payload: { candidates: Candidate[]; isSimulated: boolean } }
  | { type: 'UPDATE_CANDIDATE'; payload: Candidate }
  | { type: 'ADD_LOG'; payload: ActivityLog }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };

    case 'SET_SOURCING':
      return { ...state, isSourcing: action.payload };

    case 'SET_ENRICHING':
      return { ...state, isEnriching: action.payload };

    case 'SET_SENDING_OUTREACH':
      return { ...state, isSendingOutreach: action.payload };

    case 'SET_JOB_ANALYSIS':
      return {
        ...state,
        jobAnalysis: action.payload.analysis,
        isSimulated: action.payload.isSimulated,
        isAnalyzing: false,
        error: null,
      };

    case 'SET_CANDIDATES':
      return {
        ...state,
        candidates: action.payload.candidates,
        isSimulated: action.payload.isSimulated,
        isSourcing: false,
        error: null,
      };

    case 'UPDATE_CANDIDATE':
      return {
        ...state,
        candidates: state.candidates.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'ADD_LOG':
      return {
        ...state,
        activityLogs: [action.payload, ...state.activityLogs].slice(0, 100),
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isAnalyzing: false, isSourcing: false };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
