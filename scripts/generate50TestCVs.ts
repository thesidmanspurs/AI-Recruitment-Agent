import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface CandidateProfile {
  name: string;
  title: string;
  expYears: number;
  skills: string[];
  education: string;
  summary: string;
  highlights: string[];
}

const CANDIDATES: CandidateProfile[] = [
  {
    name: 'Sarah Chen',
    title: 'Principal Software Architect',
    expYears: 12,
    skills: ['Node.js', 'TypeScript', 'Distributed Systems', 'PostgreSQL', 'GraphQL', 'AWS', 'Docker', 'Kubernetes'],
    education: 'M.S. Computer Science, Stanford University',
    summary: 'Seasoned Principal Architect with 12+ years building high-throughput backend infrastructure, microservices, and real-time distributed platforms.',
    highlights: [
      'Architected event-driven microservices handling 50,000 requests/sec with 99.99% uptime.',
      'Reduced database latency by 45% using Redis caching and PostgreSQL query optimizations.',
      'Mentored team of 15+ senior engineers across 3 time zones.',
    ],
  },
  {
    name: 'Alex Rivera',
    title: 'Senior Backend Engineer',
    expYears: 8,
    skills: ['Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Docker', 'Kafka'],
    education: 'B.S. Software Engineering, UC Berkeley',
    summary: 'Senior Backend Developer specializing in scalable REST APIs, async messaging queues, and database performance tuning.',
    highlights: [
      'Led migration from monolith to microservices using Kafka and Node.js.',
      'Implemented OAuth2 authentication and RBAC security for 2M+ users.',
      'Built automated CI/CD pipeline reducing deployment times from 40m to 4m.',
    ],
  },
  {
    name: 'Michael Vance',
    title: 'Staff Full-Stack Developer',
    expYears: 10,
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'TailwindCSS', 'GCP'],
    education: 'B.S. Computer Science, MIT',
    summary: 'Versatile Full-Stack Engineer with deep expertise in modern React frontends and Node.js server architectures.',
    highlights: [
      'Designed real-time analytics dashboard used by 100k+ daily active business users.',
      'Optimized web vitals score from 58 to 96 across core enterprise applications.',
      'Authored open-source React component libraries with over 5,000 GitHub stars.',
    ],
  },
  {
    name: 'Elena Rostova',
    title: 'Lead AI / ML Systems Engineer',
    expYears: 7,
    skills: ['Python', 'TypeScript', 'LangChain', 'Gemini API', 'PyTorch', 'FastAPI', 'Vector DBs'],
    education: 'Ph.D. Artificial Intelligence, Carnegie Mellon University',
    summary: 'AI Systems Specialist building LLM-driven automation tools, semantic search pipelines, and agentic workflows.',
    highlights: [
      'Deploys LLM RAG pipelines processing 1M+ daily queries with sub-300ms latency.',
      'Implemented custom fine-tuning pipeline for Domain LLMs boosting accuracy by 28%.',
      'Published 4 research papers on automated code generation and agent evaluation.',
    ],
  },
  {
    name: 'David Kim',
    title: 'Senior DevOps & Cloud Architect',
    expYears: 9,
    skills: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'CI/CD', 'Node.js', 'Go', 'Prometheus'],
    education: 'B.S. Information Technology, Georgia Tech',
    summary: 'Cloud Infrastructure Architect focused on zero-downtime deployments, IaC, and Kubernetes orchestration.',
    highlights: [
      'Managed multi-region AWS Kubernetes clusters running 200+ microservices.',
      'Reduced cloud infrastructure expenditure by $320,000/year through spot instance scaling.',
      'Achieved SOC-2 compliance across all cloud container environments.',
    ],
  },
];

// Generate 45 additional variations to complete 50 distinct candidate profiles
const TITLES = [
  'Senior Software Engineer', 'Lead Full Stack Developer', 'Backend Specialist',
  'Frontend Systems Architect', 'Engineering Manager', 'DevOps Specialist',
  'Cloud Infrastructure Engineer', 'AI Agent Architect', 'Database Administrator',
  'Platform Security Engineer', 'Data Engineer', 'Site Reliability Engineer',
];

const SKILL_POOLS = [
  ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'Docker'],
  ['Python', 'FastAPI', 'PyTorch', 'Gemini', 'LangChain', 'Pinecone'],
  ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Redux', 'Jest'],
  ['Go', 'Kubernetes', 'AWS', 'Terraform', 'gRPC', 'Prometheus'],
  ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Redis', 'Elasticsearch'],
];

const UNIVERSITIES = [
  'University of Texas at Austin', 'University of Washington', 'UIUC',
  'University of Michigan', 'Cornell University', 'UCLA', 'Purdue University',
];

for (let i = 6; i <= 50; i++) {
  const name = `Candidate ${i < 10 ? '0' + i : i} - ${['John', 'Emma', 'Daniel', 'Sophia', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Isabella'][i % 10]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][i % 10]}`;
  const title = TITLES[i % TITLES.length];
  const expYears = (i % 11) + 3;
  const skills = SKILL_POOLS[i % SKILL_POOLS.length];
  const edu = `B.S. Computer Science, ${UNIVERSITIES[i % UNIVERSITIES.length]}`;
  
  CANDIDATES.push({
    name,
    title,
    expYears,
    skills,
    education: edu,
    summary: `Results-driven ${title} with ${expYears} years of hands-on software development and architecture experience.`,
    highlights: [
      `Delivered 10+ production software projects with clean modular architecture.`,
      `Improved system processing speed by ${(i * 3) % 40 + 15}% using modern optimization techniques.`,
      `Collaborated with cross-functional engineering and product management teams.`,
    ],
  });
}

async function generatePDFs() {
  const outDir = path.resolve(process.cwd(), 'test_cvs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Generating 50 candidate CV PDFs in: ${outDir}`);

  for (let i = 0; i < CANDIDATES.length; i++) {
    const c = CANDIDATES[i];
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();
    let y = height - 50;

    // Header Name
    page.drawText(c.name, {
      x: 50,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.2),
    });
    y -= 24;

    // Title & Contact
    page.drawText(`${c.title} | ${c.expYears} Years Experience`, {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.5),
    });
    y -= 18;

    page.drawText(`Email: ${c.name.toLowerCase().replace(/[^a-z]/g, '')}@example-candidate.com | Phone: +1 (555) 019-${1000 + i}`, {
      x: 50,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 25;

    // Horizontal Divider Line
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 25;

    // Professional Summary
    page.drawText('PROFESSIONAL SUMMARY', { x: 50, y, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.3) });
    y -= 16;
    page.drawText(c.summary, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 30;

    // Technical Skills
    page.drawText('TECHNICAL SKILLS', { x: 50, y, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.3) });
    y -= 16;
    page.drawText(`Core Competencies: ${c.skills.join(', ')}`, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 30;

    // Education
    page.drawText('EDUCATION', { x: 50, y, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.3) });
    y -= 16;
    page.drawText(c.education, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 30;

    // Key Achievements
    page.drawText('KEY ACHIEVEMENTS & EXPERIENCE', { x: 50, y, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.3) });
    y -= 18;

    for (const h of c.highlights) {
      page.drawText(`• ${h}`, { x: 55, y, size: 9.5, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
      y -= 16;
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `CV_${(i + 1).toString().padStart(2, '0')}_${c.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    fs.writeFileSync(path.join(outDir, fileName), pdfBytes);
  }

  console.log(`✅ Successfully generated 50 PDF candidate CVs in ${outDir}`);
}

generatePDFs().catch(console.error);
