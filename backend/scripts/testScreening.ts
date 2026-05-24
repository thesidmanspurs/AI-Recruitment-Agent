/**
 * Sanity test for Phase 3 screening logic.
 * Runs the pure screenProfiles() function against a hand-built longlist that
 * intentionally includes dupes, invalid scores, and below-threshold profiles.
 *
 * Usage: npx tsx backend/scripts/testScreening.ts
 */
import { screenProfiles } from '../services/screening/screeningService.js';
import type { RawCandidateProfile } from '../types/candidate.types.js';

const SAMPLE: RawCandidateProfile[] = [
  // Approved (>= 9.5)
  {
    name: 'Aisha Khan',
    currentTitle: 'Staff Azure Platform Engineer',
    company: 'Northwind Cloud',
    bio: 'Multi-region AKS specialist.',
    openToWork: true,
    platform: 'LinkedIn',
    matchScore: 9.8,
    matchExplanation: 'Hits every keyword.',
    skills: ['Terraform', 'AKS', 'Entra ID'],
    strengths: ['Scale leadership'],
    gaps: [],
  },
  // Duplicate of Aisha on Upwork with lower score — should be merged
  {
    name: 'aisha khan', // case-different
    currentTitle: 'Azure Consultant',
    company: 'Freelance',
    bio: 'Same person, freelance profile.',
    openToWork: true,
    platform: 'Upwork',
    matchScore: 8.9,
    matchExplanation: 'Same person, lower score.',
    skills: ['Azure', 'Terraform'],
    strengths: ['Available immediately'],
    gaps: [],
  },
  // Below threshold (< 9.5)
  {
    name: 'Bruno Costa',
    currentTitle: 'DevOps Engineer',
    company: 'Acme',
    bio: 'Generalist.',
    openToWork: false,
    platform: 'LinkedIn',
    matchScore: 8.2,
    matchExplanation: 'Some keywords match.',
    skills: ['Docker', 'Jenkins'],
    strengths: [],
    gaps: ['No Azure'],
  },
  // Approved
  {
    name: 'Chen Wei',
    currentTitle: 'Cloud Architect',
    company: 'Globex',
    bio: 'Production AKS for 5y.',
    openToWork: true,
    platform: 'Reddit',
    matchScore: 9.6,
    matchExplanation: 'Strong AKS background.',
    skills: ['AKS', 'IaC'],
    strengths: ['Active in r/azure'],
    gaps: [],
  },
  // Invalid score
  {
    name: 'Demir Yıldız',
    currentTitle: 'Engineer',
    company: 'Unknown',
    bio: '?',
    openToWork: false,
    platform: 'LinkedIn',
    matchScore: 99 as number, // out of range
    matchExplanation: '',
    skills: [],
    strengths: [],
    gaps: [],
  },
  // Approved
  {
    name: 'Elena Rossi',
    currentTitle: 'Senior Site Reliability Engineer',
    company: 'CloudCo',
    bio: 'SRE with Azure focus.',
    openToWork: true,
    platform: 'LinkedIn',
    matchScore: 9.5,
    matchExplanation: 'Exact threshold match.',
    skills: ['Terraform', 'Prometheus'],
    strengths: ['On-call leadership'],
    gaps: [],
  },
];

const result = screenProfiles(SAMPLE);

console.log('\n=== Screening Summary ===');
console.log(result.summary);

console.log('\n=== Persisted (would be saved to DB) ===');
for (const p of result.persisted) {
  console.log(
    `  ${p.matchScore.toFixed(1).padStart(4)}  ${p.name.padEnd(20)}  ${p.platform.padEnd(8)}  strengths: [${p.strengths.join('; ')}]`
  );
}

console.log('\n=== Decisions ===');
for (const d of result.decisions) {
  const tag = d.approved ? '✓ approved' : `✗ ${d.reason}`;
  console.log(`  ${tag.padEnd(28)} ${d.profile.name}  (score=${d.profile.matchScore})`);
}

// Assertions
const errors: string[] = [];
if (result.summary.total !== SAMPLE.length) errors.push(`total mismatch: ${result.summary.total} vs ${SAMPLE.length}`);
if (result.summary.approved !== 3) errors.push(`expected 3 approved, got ${result.summary.approved}`);
if (result.summary.belowThreshold !== 1) errors.push(`expected 1 below threshold, got ${result.summary.belowThreshold}`);
if (result.summary.duplicatesMerged !== 1) errors.push(`expected 1 dupe merged, got ${result.summary.duplicatesMerged}`);
if (result.summary.invalidScores !== 1) errors.push(`expected 1 invalid score, got ${result.summary.invalidScores}`);

const aisha = result.persisted.find(p => p.name.toLowerCase() === 'aisha khan');
if (!aisha) errors.push('Aisha should survive dedupe');
else if (aisha.matchScore !== 9.8) errors.push(`Aisha should keep score 9.8, got ${aisha.matchScore}`);
else if (!aisha.strengths.some(s => /upwork/i.test(s))) errors.push('Aisha should have Upwork platform merged onto strengths');

if (errors.length === 0) {
  console.log('\n✅ All assertions passed.');
  process.exit(0);
} else {
  console.error('\n❌ Failures:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
