import { useAppContext } from '../store/AppContext';
import { candidateApi } from '../api/candidateApi';
import type { JobAnalysis } from '../types';

export function useCandidates() {
  const { state, dispatch } = useAppContext();

  async function sourceCandidates(analysis: JobAnalysis): Promise<void> {
    dispatch({ type: 'SET_SOURCING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      // Phase 2 + 3 implementation goes here
      throw new Error('Phase 2/3: useCandidates.sourceCandidates not yet implemented');
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }

  const approvedQueue = state.candidates.filter(c => c.matchScore >= 9.5);
  const rejectedCandidates = state.candidates.filter(c => c.matchScore < 9.5);

  return {
    candidates: state.candidates,
    approvedQueue,
    rejectedCandidates,
    isSourcing: state.isSourcing,
    sourceCandidates,
  };
}
