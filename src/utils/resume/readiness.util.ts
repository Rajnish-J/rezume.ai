import { and, desc, eq } from "drizzle-orm";

import { pgdb } from "@/src/lib/db/pg/db";
import {
  resumeReadinessReportsTable,
  resumeSkillAssessmentsTable,
} from "@/src/lib/db/schema";
import { ReadinessReport } from "@/src/types/resume.types";

export async function saveReadinessReport(options: {
  resumeId: number;
  userId: number;
  report: ReadinessReport;
}): Promise<void> {
  const [savedReport] = await pgdb
    .insert(resumeReadinessReportsTable)
    .values({
      resumeId: options.resumeId,
      userId: options.userId,
      roleSlug: options.report.roleSlug,
      roleName: options.report.roleName,
      taxonomyVersion: options.report.taxonomyVersion,
      readinessScore: options.report.readinessScore,
      coverageCore: options.report.coverage.core,
      coverageProduction: options.report.coverage.production,
      coverageProfessional: options.report.coverage.professional,
      summary: options.report.summary,
    })
    .returning();

  await pgdb.insert(resumeSkillAssessmentsTable).values(
    options.report.assessments.map((assessment) => ({
      reportId: savedReport.id,
      skillKey: assessment.skillKey,
      skillName: assessment.skillName,
      category: assessment.category,
      weight: assessment.weight,
      claimed: assessment.evidence.claimed,
      projectProven: assessment.evidence.projectProven,
      experienceProven: assessment.evidence.experienceProven,
      score: assessment.score,
      strength: assessment.strength,
      explanation: assessment.explanation,
    })),
  );
}

export async function fetchLatestReadinessReportForResume(options: {
  resumeId: number;
  userId: number;
}): Promise<ReadinessReport | null> {
  const [reportRow] = await pgdb
    .select()
    .from(resumeReadinessReportsTable)
    .where(
      and(
        eq(resumeReadinessReportsTable.resumeId, options.resumeId),
        eq(resumeReadinessReportsTable.userId, options.userId),
      ),
    )
    .orderBy(desc(resumeReadinessReportsTable.createdAt))
    .limit(1);

  if (!reportRow) {
    return null;
  }

  const assessmentRows = await pgdb
    .select()
    .from(resumeSkillAssessmentsTable)
    .where(eq(resumeSkillAssessmentsTable.reportId, reportRow.id))
    .orderBy(desc(resumeSkillAssessmentsTable.weight));

  return {
    roleSlug: reportRow.roleSlug,
    roleName: reportRow.roleName,
    taxonomyVersion: reportRow.taxonomyVersion,
    readinessScore: reportRow.readinessScore,
    coverage: {
      core: reportRow.coverageCore,
      production: reportRow.coverageProduction,
      professional: reportRow.coverageProfessional,
    },
    summary: reportRow.summary,
    assessments: assessmentRows.map((assessment) => ({
      skillKey: assessment.skillKey,
      skillName: assessment.skillName,
      category: assessment.category,
      weight: assessment.weight,
      score: assessment.score,
      strength: assessment.strength,
      evidence: {
        claimed: assessment.claimed,
        projectProven: assessment.projectProven,
        experienceProven: assessment.experienceProven,
      },
      explanation: assessment.explanation,
    })),
  };
}
