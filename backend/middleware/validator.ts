import type { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export function validateAnalyzeJobSpec(req: Request, res: Response, next: NextFunction): void {
  const { jobText } = req.body;
  if (!jobText || typeof jobText !== 'string' || jobText.trim() === '') {
    return next(createError('jobText is required and must be a non-empty string.', 400));
  }
  next();
}

export function validateSourceCandidates(req: Request, res: Response, next: NextFunction): void {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return next(createError('title is required for candidate sourcing.', 400));
  }
  next();
}

export function validateGenerateMessage(req: Request, res: Response, next: NextFunction): void {
  const { candidateId, originalSpec } = req.body;
  if (!candidateId || !originalSpec) {
    return next(createError('candidateId and originalSpec are required.', 400));
  }
  next();
}

export function validateEnrichment(req: Request, res: Response, next: NextFunction): void {
  const { candidateId, name, company } = req.body;
  if (!candidateId || !name || !company) {
    return next(createError('candidateId, name, and company are required for enrichment.', 400));
  }
  next();
}
