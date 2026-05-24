import { FileText, ChevronRight } from 'lucide-react';
import type { JobAnalysis } from '../../types';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface Phase1JobIngestionProps {
  jobText: string;
  onJobTextChange: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysis: JobAnalysis | null;
  isSimulated: boolean;
}

export function Phase1JobIngestion({
  jobText,
  onJobTextChange,
  onAnalyze,
  isAnalyzing,
  analysis,
  isSimulated,
}: Phase1JobIngestionProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">1</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Job Specification Ingestion</h2>
          <p className="text-xs text-gray-400">Paste the raw JD. AI parses entities and builds Boolean search queries.</p>
        </div>
      </div>

      <textarea
        className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-blue-500"
        placeholder="Paste job description here..."
        value={jobText}
        onChange={e => onJobTextChange(e.target.value)}
      />

      <Button
        icon={<FileText className="w-4 h-4" />}
        loading={isAnalyzing}
        disabled={!jobText.trim()}
        onClick={onAnalyze}
      >
        Analyze Job Spec
      </Button>

      {isAnalyzing && <LoadingSpinner message="Parsing job description..." />}

      {analysis && !isAnalyzing && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{analysis.title}</h3>
            {isSimulated && <Badge variant="yellow">Simulated</Badge>}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Alternate Titles</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.alternateTitles.map(t => (
                <Badge key={t} variant="blue">{t}</Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.extractedKeywords.map(k => (
                <Badge key={k} variant="purple">{k}</Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Requirements</p>
            <ul className="space-y-1">
              {analysis.requirements.map((r, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-blue-400 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
