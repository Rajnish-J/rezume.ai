import { RoleSkill, RoleTaxonomy } from "@/src/types/career.types";
import {
  InterviewRoadmap,
  ReadinessReport,
  SkillAssessment,
  SkillEvidence,
} from "@/src/types/resume.types";

const skillKeywordOverrides: Record<string, string[]> = {
  "auth-patterns": ["auth", "jwt", "oauth", "session"],
  "authorization-rbac": ["rbac", "role based", "authorization", "permission"],
  "rest-api": ["rest", "api", "endpoint", "http"],
  "rest-api-java": ["rest", "spring", "controller", "endpoint"],
  deployment: ["deploy", "deployment", "aws", "render", "vercel", "railway"],
  docker: ["docker", "container", "dockerfile"],
  "backend-testing": ["test", "jest", "junit", "integration test", "unit test"],
  "frontend-security": ["xss", "csrf", "sanitize", "security"],
  "system-design-basics": ["scalability", "caching", "queue", "load balancer"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function keywordsForSkill(skill: RoleSkill): string[] {
  if (skillKeywordOverrides[skill.skillKey]) {
    return skillKeywordOverrides[skill.skillKey];
  }

  const fromKey = skill.skillKey.split("-").filter(Boolean);
  const fromName = skill.skillName
    .toLowerCase()
    .replace(/[()/,+]/g, " ")
    .split(/\s+/)
    .filter((item) => item.length > 2);

  return Array.from(new Set([...fromKey, ...fromName]));
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

function extractScopedText(lines: string[], headingTokens: string[]): string {
  const captured: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!includesAny(line, headingTokens)) {
      continue;
    }

    const windowEnd = Math.min(lines.length, index + 8);
    for (let pointer = index; pointer < windowEnd; pointer += 1) {
      captured.push(lines[pointer]);
    }
  }

  return captured.join(" ");
}

function scoreEvidence(evidence: SkillEvidence): number {
  const claimedScore = evidence.claimed ? 40 : 0;
  const projectScore = evidence.projectProven ? 35 : 0;
  const experienceScore = evidence.experienceProven ? 25 : 0;
  return claimedScore + projectScore + experienceScore;
}

function toStrength(score: number): "missing" | "weak" | "strong" {
  if (score >= 75) {
    return "strong";
  }

  if (score >= 35) {
    return "weak";
  }

  return "missing";
}

function toExplanation(skillName: string, evidence: SkillEvidence, score: number): string {
  if (!evidence.claimed && !evidence.projectProven && !evidence.experienceProven) {
    return `${skillName} is missing: no claim and no project/experience proof in your resume.`;
  }

  if (evidence.claimed && !evidence.projectProven && !evidence.experienceProven) {
    return `${skillName} is claimed but not proven through project or work evidence.`;
  }

  if (evidence.projectProven && !evidence.experienceProven) {
    return `${skillName} has project proof, but work-experience depth is still limited.`;
  }

  if (!evidence.projectProven && evidence.experienceProven) {
    return `${skillName} appears in experience, but project-level demonstration is weak.`;
  }

  return `${skillName} is well supported with strong evidence (${score}%).`;
}

function weightedAverage(items: Array<{ score: number; weight: number }>): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const totalScore = items.reduce((sum, item) => sum + item.score * item.weight, 0);
  return Math.round(totalScore / totalWeight);
}

function coverageByCategory(
  assessments: SkillAssessment[],
): { core: number; production: number; professional: number } {
  const core = weightedAverage(
    assessments
      .filter((item) => item.category === "core")
      .map((item) => ({ score: item.score, weight: item.weight })),
  );
  const production = weightedAverage(
    assessments
      .filter((item) => item.category === "production")
      .map((item) => ({ score: item.score, weight: item.weight })),
  );
  const professional = weightedAverage(
    assessments
      .filter((item) => item.category === "professional")
      .map((item) => ({ score: item.score, weight: item.weight })),
  );

  return { core, production, professional };
}

export function evaluateResumeReadiness(options: {
  resumeText: string;
  taxonomy: RoleTaxonomy;
}): ReadinessReport {
  const normalizedText = normalize(options.resumeText);
  const lines = normalizedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const projectText = extractScopedText(lines, ["project", "projects", "built", "implemented"]);
  const experienceText = extractScopedText(lines, ["experience", "work", "company", "engineer", "developer"]);

  const assessments = options.taxonomy.skills.map((skill) => {
    const keywords = keywordsForSkill(skill);

    const evidence: SkillEvidence = {
      claimed: includesAny(normalizedText, keywords),
      projectProven: includesAny(projectText, keywords),
      experienceProven: includesAny(experienceText, keywords),
    };

    const score = scoreEvidence(evidence);
    const strength = toStrength(score);

    return {
      skillKey: skill.skillKey,
      skillName: skill.skillName,
      category: skill.category,
      weight: skill.weight,
      score,
      strength,
      evidence,
      explanation: toExplanation(skill.skillName, evidence, score),
    } satisfies SkillAssessment;
  });

  const readinessScore = weightedAverage(
    assessments.map((item) => ({ score: item.score, weight: item.weight })),
  );
  const coverage = coverageByCategory(assessments);

  const missingCount = assessments.filter((item) => item.strength === "missing").length;
  const weakCount = assessments.filter((item) => item.strength === "weak").length;
  const summary = `Readiness ${readinessScore}% for ${options.taxonomy.name}. Missing: ${missingCount}, weak: ${weakCount}.`;

  return {
    roleSlug: options.taxonomy.slug,
    roleName: options.taxonomy.name,
    taxonomyVersion: options.taxonomy.version,
    readinessScore,
    coverage,
    summary,
    assessments,
  };
}

export function inferProfileLevelFromResume(text: string): string {
  const normalizedText = normalize(text);
  const yearMatches = normalizedText.match(/(\d+)\s*(\+)?\s*(years|yrs)/g) ?? [];
  const parsedYears = yearMatches
    .map((value) => Number(value.match(/\d+/)?.[0] ?? 0))
    .filter((value) => Number.isFinite(value));

  const maxYears = parsedYears.length > 0 ? Math.max(...parsedYears) : 0;

  if (maxYears >= 5) {
    return "mid-senior";
  }

  if (maxYears >= 2) {
    return "mid-level";
  }

  return "fresher-junior";
}

export function generateInterviewRoadmap(options: {
  report: ReadinessReport;
  profileLevel: string;
}): InterviewRoadmap {
  const focusSkills = [...options.report.assessments]
    .sort((left, right) => {
      if (left.score === right.score) {
        return right.weight - left.weight;
      }

      return left.score - right.score;
    })
    .slice(0, 6)
    .map((item) => item.skillName);

  const focusText = focusSkills.length > 0 ? focusSkills.join(", ") : "core fundamentals";
  const estimatedDurationWeeks = options.profileLevel === "mid-level" ? 6 : 8;

  return {
    targetRole: options.report.roleName,
    profileLevel: options.profileLevel,
    estimatedDurationWeeks,
    steps: [
      {
        phase: "Phase 1 - Gap Fixing",
        focus: `Strengthen weak/missing skills: ${focusText}.`,
        output: "2 focused mini-implementations with clean README and tests.",
        interviewRound: "Technical screening",
      },
      {
        phase: "Phase 2 - Production Build",
        focus: "Build one production-style project covering auth, data, and deployment.",
        output: "Deployed project with architecture notes and tradeoff explanations.",
        interviewRound: "Machine coding / assignment",
      },
      {
        phase: "Phase 3 - System and Testing Depth",
        focus: "Add observability, testing strategy, and failure handling.",
        output: "Test report, monitoring checklist, and incident-style postmortem notes.",
        interviewRound: "Round 2 technical deep-dive",
      },
      {
        phase: "Phase 4 - Interview Sprint",
        focus: "Mock interviews for DSA basics, design tradeoffs, and resume storytelling.",
        output: "30-second pitch, project walkthrough script, and STAR answers.",
        interviewRound: "Final panel / hiring manager",
      },
    ],
  };
}
