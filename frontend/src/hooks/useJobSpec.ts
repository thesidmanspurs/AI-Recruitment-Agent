import { useAppContext } from '../store/AppContext';
import { jobSpecApi } from '../api/jobSpecApi';
import type { ActivityLog } from '../types';

export function useJobSpec() {
  const { state, dispatch } = useAppContext();

  function addLog(message: string, type: ActivityLog['type'] = 'info'): void {
    dispatch({
      type: 'ADD_LOG',
      payload: {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message,
        type,
      },
    });
  }

  async function analyzeJobSpec(jobText: string): Promise<void> {
    dispatch({ type: 'SET_ANALYZING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const result = await jobSpecApi.analyze(jobText);
      if (!result.success || !result.analysis) {
        throw new Error((result as any).error || 'Analysis returned no data');
      }
      dispatch({
        type: 'SET_JOB_ANALYSIS',
        payload: { analysis: result.analysis, isSimulated: result.isSimulated },
      });
      addLog(
        `Job spec analyzed: "${result.analysis.title}"${result.isSimulated ? ' [simulated]' : ''}`,
        'info'
      );
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }

  return {
    jobAnalysis: state.jobAnalysis,
    isAnalyzing: state.isAnalyzing,
    isSimulated: state.isSimulated,
    error: state.error,
    analyzeJobSpec,
    addLog,
  };
}
