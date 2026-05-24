export interface JobAnalysis {
  title: string;
  alternateTitles: string[];
  extractedKeywords: string[];
  requirements: string[];
  preferredPlatforms: string[];
}

export interface JobSpec extends JobAnalysis {
  id: string;
  rawText: string;
  analyzedAt: string;
}

export interface AnalyzeJobSpecRequest {
  jobText: string;
}

export interface SourceCandidatesRequest {
  title: string;
  alternateTitles: string[];
  extractedKeywords: string[];
  requirements: string[];
}
